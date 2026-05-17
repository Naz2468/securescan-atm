import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FACE_THRESHOLD = 0.5;

function euclideanDistance(a: number[], b: number[]) {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

export const authenticate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        account_no: z.string().min(4).max(20),
        face_descriptor: z.array(z.number()).length(128),
        finger_score: z.number().min(0).max(100),
        finger_match: z.boolean(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const { data: user, error: uerr } = await supabaseAdmin
      .from("atm_users")
      .select("id, full_name, account_no, balance")
      .eq("account_no", data.account_no)
      .maybeSingle();

    const log = async (granted: boolean, face_match: boolean, face_score: number) => {
      await supabaseAdmin.from("auth_logs").insert({
        user_id: user?.id ?? null,
        account_no: data.account_no,
        face_match,
        finger_match: data.finger_match,
        face_score,
        finger_score: data.finger_score,
        auth_result: granted ? "GRANTED" : "DENIED",
      });
    };

    if (!user) {
      await log(false, false, 0);
      return {
        granted: false,
        reason: "Account not found",
        face_match: false,
        face_score: 0,
        finger_match: data.finger_match,
        finger_score: data.finger_score,
      };
    }

    const { data: bio } = await supabaseAdmin
      .from("biometrics")
      .select("face_descriptor")
      .eq("user_id", user.id)
      .order("registered_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!bio?.face_descriptor) {
      await log(false, false, 0);
      return {
        granted: false,
        reason: "No biometric template enrolled for this account",
        face_match: false,
        face_score: 0,
        finger_match: data.finger_match,
        finger_score: data.finger_score,
      };
    }

    const stored = JSON.parse(bio.face_descriptor) as number[];
    const dist = euclideanDistance(stored, data.face_descriptor);
    const face_match = dist < FACE_THRESHOLD;
    const face_score = Math.max(0, Math.min(100, (1 - dist) * 100));
    const granted = face_match && data.finger_match;

    await log(granted, face_match, face_score);

    if (!granted) {
      return {
        granted: false,
        reason: !face_match && !data.finger_match
          ? "Both factors failed"
          : !face_match
            ? "Face did not match"
            : "Fingerprint did not match",
        face_match,
        face_score,
        finger_match: data.finger_match,
        finger_score: data.finger_score,
      };
    }

    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const { data: sess, error: serr } = await supabaseAdmin
      .from("atm_sessions")
      .insert({ user_id: user.id, expires_at: expiresAt })
      .select("token")
      .single();
    if (serr || !sess) throw new Error("session-create-failed");

    return {
      granted: true,
      face_match,
      face_score,
      finger_match: data.finger_match,
      finger_score: data.finger_score,
      session_token: sess.token,
      session_expires_at: expiresAt,
      user: {
        id: user.id,
        full_name: user.full_name,
        account_no: user.account_no,
        balance: Number(user.balance),
      },
    };
  });

export const transact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        session_token: z.string().uuid(),
        type: z.enum(["WITHDRAWAL", "BALANCE", "TRANSFER", "DEPOSIT"]),
        amount: z.number().positive().optional(),
        recipient: z.string().min(4).max(20).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const { data: sess } = await supabaseAdmin
      .from("atm_sessions")
      .select("token, user_id, expires_at")
      .eq("token", data.session_token)
      .maybeSingle();

    if (!sess) throw new Error("Invalid session");
    if (new Date(sess.expires_at).getTime() < Date.now()) {
      throw new Error("Session expired");
    }

    const { data: user } = await supabaseAdmin
      .from("atm_users")
      .select("id, full_name, account_no, balance")
      .eq("id", sess.user_id)
      .single();
    if (!user) throw new Error("User not found");

    const reference = "TXN" + Date.now().toString(36).toUpperCase();
    let newBalance = Number(user.balance);

    if (data.type === "BALANCE") {
      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        type: "BALANCE",
        amount: 0,
        reference,
        status: "SUCCESS",
      });
      return { success: true, reference, new_balance: newBalance };
    }

    if (!data.amount || data.amount <= 0) throw new Error("Amount required");

    if (data.type === "WITHDRAWAL") {
      if (newBalance < data.amount) throw new Error("Insufficient funds");
      newBalance -= data.amount;
      await supabaseAdmin.from("atm_users").update({ balance: newBalance }).eq("id", user.id);
      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        type: "WITHDRAWAL",
        amount: data.amount,
        reference,
        status: "SUCCESS",
      });
      return { success: true, reference, new_balance: newBalance };
    }

    if (data.type === "DEPOSIT") {
      newBalance += data.amount;
      await supabaseAdmin.from("atm_users").update({ balance: newBalance }).eq("id", user.id);
      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        type: "DEPOSIT",
        amount: data.amount,
        reference,
        status: "SUCCESS",
      });
      return { success: true, reference, new_balance: newBalance };
    }

    if (data.type === "TRANSFER") {
      if (!data.recipient) throw new Error("Recipient required");
      if (data.recipient === user.account_no) throw new Error("Cannot transfer to self");
      const { data: dest } = await supabaseAdmin
        .from("atm_users")
        .select("id, balance")
        .eq("account_no", data.recipient)
        .maybeSingle();
      if (!dest) throw new Error("Recipient account not found");
      if (newBalance < data.amount) throw new Error("Insufficient funds");
      newBalance -= data.amount;
      const destBal = Number(dest.balance) + data.amount;
      await supabaseAdmin.from("atm_users").update({ balance: newBalance }).eq("id", user.id);
      await supabaseAdmin.from("atm_users").update({ balance: destBal }).eq("id", dest.id);
      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        type: "TRANSFER",
        amount: data.amount,
        recipient: data.recipient,
        reference,
        status: "SUCCESS",
      });
      return { success: true, reference, new_balance: newBalance };
    }

    throw new Error("Unknown transaction type");
  });
