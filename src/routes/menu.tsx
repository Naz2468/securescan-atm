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
      <div className="min-h-screen bg-background font-mono">
        <TerminalHeader step={2} />
        <main className="mx-auto max-w-md px-4 py-16 text-center text-muted">
          Loading session…
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      <TerminalHeader step={2} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs tracking-widest text-muted">WELCOME</div>
            <div className="text-xl text-accent">{user.full_name}</div>
            <div className="text-xs text-muted">{maskAccount(user.account_no)}</div>
          </div>
          <div className="flex items-center gap-3">
            <SessionTimer expiresAt={sessionExpiry} onExpire={logout} />
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded border border-danger px-3 py-1 text-xs tracking-widest text-danger hover:bg-[color:var(--danger)] hover:text-[color:var(--bg)]"
            >
              <LogOut className="h-3 w-3" /> LOGOUT
            </button>
          </div>
        </div>

        {view !== "GRID" && (
          <button
            onClick={() => setView("GRID")}
            className="mb-4 inline-flex items-center gap-2 text-xs tracking-widest text-muted hover:text-accent"
          >
            <ArrowLeft className="h-3 w-3" /> BACK TO MENU
          </button>
        )}

        {view === "GRID" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Tile
              icon={<Wallet className="h-6 w-6" />}
              title="CHECK BALANCE"
              desc="View available balance"
              onClick={() => setView("BALANCE")}
            />
            <Tile
              icon={<Banknote className="h-6 w-6" />}
              title="WITHDRAW"
              desc="Cash withdrawal"
              onClick={() => setView("WITHDRAW")}
            />
            <Tile
              icon={<ArrowLeftRight className="h-6 w-6" />}
              title="TRANSFER"
              desc="Move funds to another account"
              onClick={() => setView("TRANSFER")}
            />
            <Tile
              icon={<History className="h-6 w-6" />}
              title="TRANSACTION HISTORY"
              desc="Last 10 transactions"
              onClick={() => setView("HISTORY")}
            />
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

        <ReceiptModal data={receipt} onClose={() => setReceipt(null)} />
      </main>
    </div>
  );
}

function Tile({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded border border-[color:var(--border)] bg-panel p-6 text-left transition hover:border-accent hover:bg-accent-dim"
    >
      <div className="text-accent">{icon}</div>
      <div>
        <div className="text-sm tracking-widest text-accent">{title}</div>
        <div className="text-xs text-muted">{desc}</div>
      </div>
    </button>
  );
}

function BalanceView() {
  const { user } = useAuth();
  return (
    <div className="rounded border border-[color:var(--border)] bg-panel p-8 text-center">
      <div className="text-xs tracking-widest text-muted">AVAILABLE BALANCE</div>
      <div className="count-in mt-4 text-5xl tracking-widest text-accent sm:text-6xl">
        {formatNGN(user?.balance ?? 0)}
      </div>
      <div className="mt-3 text-xs text-muted">{new Date().toLocaleString("en-GB")}</div>
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
    <div className="rounded border border-[color:var(--border)] bg-panel p-6">
      <div className="text-xs tracking-widest text-muted">WITHDRAW AMOUNT</div>
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        className="mt-2 w-full rounded border border-[color:var(--border)] bg-background px-4 py-3 text-2xl tracking-widest outline-none focus:border-accent"
      />
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {DENOMS.map((d) => (
          <button
            key={d}
            onClick={() => setAmount(String(d))}
            className="rounded border border-[color:var(--border)] py-2 text-xs tracking-widest hover:border-accent hover:text-accent"
          >
            ₦{d.toLocaleString()}
          </button>
        ))}
      </div>
      {err && <div className="mt-3 text-xs text-danger">⚠ {err}</div>}
      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 w-full rounded border border-accent bg-accent py-3 text-sm font-bold tracking-widest text-[color:var(--bg)] hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "PROCESSING..." : "CONFIRM WITHDRAWAL"}
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
        data: {
          session_token: sessionToken,
          type: "TRANSFER",
          amount: n,
          recipient,
        },
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
    <div className="rounded border border-[color:var(--border)] bg-panel p-6">
      <div className="text-xs tracking-widest text-muted">RECIPIENT ACCOUNT</div>
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value.replace(/\D/g, "").slice(0, 20))}
        placeholder="0000000000"
        className="mt-2 w-full rounded border border-[color:var(--border)] bg-background px-4 py-3 text-lg tracking-widest outline-none focus:border-accent"
      />
      <div className="mt-4 text-xs tracking-widest text-muted">AMOUNT</div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        className="mt-2 w-full rounded border border-[color:var(--border)] bg-background px-4 py-3 text-2xl tracking-widest outline-none focus:border-accent"
      />
      {err && <div className="mt-3 text-xs text-danger">⚠ {err}</div>}
      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 w-full rounded border border-accent bg-accent py-3 text-sm font-bold tracking-widest text-[color:var(--bg)] hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "PROCESSING..." : "CONFIRM TRANSFER"}
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
      <div className="flex items-center justify-center gap-2 rounded border border-[color:var(--border)] bg-panel p-8 text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded border border-[color:var(--border)] bg-panel p-8 text-center text-muted">
        No transactions yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[color:var(--border)] bg-panel">
      <table className="w-full text-left text-xs">
        <thead className="bg-background text-muted">
          <tr>
            <th className="px-3 py-2">DATE</th>
            <th className="px-3 py-2">TYPE</th>
            <th className="px-3 py-2">AMOUNT</th>
            <th className="px-3 py-2">REFERENCE</th>
            <th className="px-3 py-2">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[color:var(--border)]">
              <td className="px-3 py-2 text-muted">
                {new Date(r.created_at).toLocaleString("en-GB")}
              </td>
              <td className="px-3 py-2">{r.type}</td>
              <td
                className={`px-3 py-2 ${
                  r.type === "WITHDRAWAL" || r.type === "TRANSFER"
                    ? "text-danger"
                    : "text-accent"
                }`}
              >
                {r.amount ? formatNGN(r.amount) : "—"}
              </td>
              <td className="px-3 py-2 text-muted">{r.reference}</td>
              <td className="px-3 py-2 text-accent">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
