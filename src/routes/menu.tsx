import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { SessionTimer } from "@/components/SessionTimer";
import { ReceiptModal, type ReceiptData } from "@/components/ReceiptModal";
import { useAuth } from "@/contexts/AuthContext";
import { useServerFn } from "@tanstack/react-start";
import { transact } from "@/lib/atm.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatNGN, maskAccount } from "@/lib/format";
import {
  Wallet,
  Banknote,
  ArrowLeftRight,
  History,
  LogOut,
  ArrowLeft,
  Loader2,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

export const Route = createFileRoute("/menu")({
  component: MenuPage,
});

type View = "GRID" | "BALANCE" | "WITHDRAW" | "TRANSFER" | "HISTORY";

function MenuPage() {
  const { user, sessionToken, sessionExpiry, setUser, clearSession } = useAuth();
  const nav = useNavigate();
  const [view, setView] = useState<View>("GRID");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionToken || !sessionExpiry || sessionExpiry < Date.now()) {
      nav({ to: "/" });
    }
  }, [sessionToken, sessionExpiry, nav]);

  const logout = () => {
    clearSession();
    nav({ to: "/" });
  };

  if (!user || !sessionToken || !sessionExpiry) {
    return (
      <div className="min-h-screen bg-background">
        <TerminalHeader step={2} />
        <main className="mx-auto max-w-md px-5 py-16 text-center text-muted">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TerminalHeader step={2} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-dim font-semibold text-accent sm:h-12 sm:w-12">
              {user.full_name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="text-xs text-muted">Welcome</div>
              <div className="text-sm font-medium sm:text-base">{user.full_name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SessionTimer expiresAt={sessionExpiry} onExpire={logout} />
            <button
              onClick={logout}
              className="grid h-9 w-9 place-items-center rounded-full bg-panel text-danger hover:bg-[color:var(--danger)] hover:text-[color:var(--bg)]"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#9bef5a] via-[#5ed47a] to-[#1f2e26] p-6 text-[color:var(--bg)] shadow-xl sm:p-8 lg:col-span-2">
            <div className="text-xs opacity-70 sm:text-sm">Main Wallet</div>
            <div className="mt-1 text-3xl font-semibold sm:text-4xl">{formatNGN(user.balance)}</div>
            <div className="mt-1 text-xs opacity-70 sm:text-sm">{maskAccount(user.account_no)}</div>
            <div className="mt-6 flex gap-2 sm:mt-10">
              <button
                onClick={() => setView("WITHDRAW")}
                className="flex-1 rounded-full bg-[color:var(--bg)]/15 py-2 text-sm font-medium backdrop-blur"
              >
                Withdraw
              </button>
              <button
                onClick={() => setView("TRANSFER")}
                className="flex-1 rounded-full bg-[color:var(--bg)] py-2 text-sm font-medium text-accent"
              >
                Transfer
              </button>
            </div>
          </section>

          <div className="lg:col-span-3">
            {view !== "GRID" && (
              <button
                onClick={() => setView("GRID")}
                className="mb-3 inline-flex items-center gap-2 text-sm text-muted hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}

            {view === "GRID" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <Tile icon={<Wallet className="h-5 w-5" />} title="Balance" onClick={() => setView("BALANCE")} />
                <Tile icon={<Banknote className="h-5 w-5" />} title="Withdraw" onClick={() => setView("WITHDRAW")} />
                <Tile icon={<ArrowLeftRight className="h-5 w-5" />} title="Transfer" onClick={() => setView("TRANSFER")} />
                <Tile icon={<History className="h-5 w-5" />} title="History" onClick={() => setView("HISTORY")} />
              </div>
            )}

            {view === "BALANCE" && <BalanceView />}
            {view === "WITHDRAW" && (
              <WithdrawView
                onDone={(r) => {
                  setReceipt(r);
                  setUser({ ...user, balance: r.new_balance });
                }}
              />
            )}
            {view === "TRANSFER" && (
              <TransferView
                onDone={(r) => {
                  setReceipt(r);
                  setUser({ ...user, balance: r.new_balance });
                }}
              />
            )}
            {view === "HISTORY" && <HistoryView userId={user.id} />}
          </div>
        </div>

        <ReceiptModal data={receipt} onClose={() => setReceipt(null)} />
      </main>
    </div>
  );
}

function Tile({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-3xl bg-panel p-4 text-left transition hover:bg-accent-dim"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-[color:var(--bg)]">
        {icon}
      </span>
      <span className="text-sm font-medium">{title}</span>
    </button>
  );
}

function BalanceView() {
  const { user } = useAuth();
  return (
    <div className="mt-5 rounded-3xl bg-panel p-8 text-center">
      <div className="text-xs text-muted">Available balance</div>
      <div className="mt-3 text-4xl font-semibold text-accent">{formatNGN(user?.balance ?? 0)}</div>
      <div className="mt-2 text-xs text-muted">{new Date().toLocaleString("en-GB")}</div>
    </div>
  );
}

const DENOMS = [1000, 2000, 5000, 10000, 20000, 50000];

function WithdrawView({ onDone }: { onDone: (r: ReceiptData) => void }) {
  const { user, sessionToken } = useAuth();
  const txn = useServerFn(transact);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!user || !sessionToken) return;
    const n = parseFloat(amount);
    if (!n || n <= 0) return setErr("Enter a valid amount");
    setBusy(true);
    setErr(null);
    try {
      const r = (await txn({
        data: { session_token: sessionToken, type: "WITHDRAWAL", amount: n },
      })) as { success: boolean; reference: string; new_balance: number };
      onDone({
        reference: r.reference,
        type: "WITHDRAWAL",
        amount: n,
        new_balance: r.new_balance,
        account_no: user.account_no,
        full_name: user.full_name,
      });
      setAmount("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 rounded-3xl bg-panel p-5">
      <div className="text-xs text-muted">Amount</div>
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        className="mt-1 w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-muted/60"
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {DENOMS.map((d) => (
          <button
            key={d}
            onClick={() => setAmount(String(d))}
            className="rounded-full bg-[color:var(--panel-2)] py-2 text-xs hover:text-accent"
          >
            ₦{d.toLocaleString()}
          </button>
        ))}
      </div>
      {err && <div className="mt-3 text-xs text-danger">⚠ {err}</div>}
      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 w-full rounded-full bg-accent py-3 font-medium text-[color:var(--bg)] hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "Processing…" : "Confirm withdrawal"}
      </button>
    </div>
  );
}

function TransferView({ onDone }: { onDone: (r: ReceiptData) => void }) {
  const { user, sessionToken } = useAuth();
  const txn = useServerFn(transact);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!user || !sessionToken) return;
    const n = parseFloat(amount);
    if (!recipient || recipient.length < 6) return setErr("Invalid recipient");
    if (!n || n <= 0) return setErr("Enter a valid amount");
    setBusy(true);
    setErr(null);
    try {
      const r = (await txn({
        data: { session_token: sessionToken, type: "TRANSFER", amount: n, recipient },
      })) as { success: boolean; reference: string; new_balance: number };
      onDone({
        reference: r.reference,
        type: "TRANSFER",
        amount: n,
        recipient,
        new_balance: r.new_balance,
        account_no: user.account_no,
        full_name: user.full_name,
      });
      setAmount("");
      setRecipient("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-3xl bg-panel p-5">
        <div className="text-xs text-muted">Recipient</div>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.replace(/\D/g, "").slice(0, 20))}
          placeholder="0000000000"
          className="mt-1 w-full bg-transparent text-lg outline-none placeholder:text-muted/60"
        />
      </div>
      <div className="rounded-3xl bg-panel p-5">
        <div className="text-xs text-muted">Amount</div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="mt-1 w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-muted/60"
        />
      </div>
      {err && <div className="text-xs text-danger">⚠ {err}</div>}
      <button
        onClick={submit}
        disabled={busy}
        className="w-full rounded-full bg-accent py-3 font-medium text-[color:var(--bg)] hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "Processing…" : "Send"}
      </button>
    </div>
  );
}

type Tx = {
  id: string;
  type: string;
  amount: number | null;
  reference: string | null;
  status: string;
  recipient: string | null;
  created_at: string;
};

function HistoryView({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Tx[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, type, amount, reference, status, recipient, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setRows(((data ?? []) as Tx[]) || []);
    })();
  }, [userId]);

  if (!rows) {
    return (
      <div className="mt-5 flex items-center justify-center gap-2 rounded-3xl bg-panel p-8 text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-5 rounded-3xl bg-panel p-8 text-center text-muted">No transactions yet.</div>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      {rows.map((r) => {
        const out = r.type === "WITHDRAWAL" || r.type === "TRANSFER";
        return (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-panel p-4">
            <span
              className={`grid h-9 w-9 place-items-center rounded-full ${
                out ? "bg-[color:var(--danger)]/15 text-danger" : "bg-accent-dim text-accent"
              }`}
            >
              {out ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </span>
            <div className="flex-1">
              <div className="text-sm">{r.type}</div>
              <div className="text-xs text-muted">{new Date(r.created_at).toLocaleString("en-GB")}</div>
            </div>
            <div className={`text-sm font-medium ${out ? "text-danger" : "text-accent"}`}>
              {r.amount ? formatNGN(r.amount) : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
