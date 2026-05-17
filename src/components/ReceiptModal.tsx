import { X } from "lucide-react";
import { formatNGN } from "@/lib/format";

export type ReceiptData = {
  reference: string;
  type: string;
  amount?: number;
  recipient?: string;
  new_balance: number;
  account_no: string;
  full_name: string;
};

export function ReceiptModal({
  data,
  onClose,
}: {
  data: ReceiptData | null;
  onClose: () => void;
}) {
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center">
      <div className="w-full max-w-sm translate-y-0 rounded border border-[color:var(--border)] bg-panel p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs tracking-widest text-accent">RECEIPT</div>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="receipt-border space-y-2 py-4 font-mono text-sm">
          <div className="text-center text-accent">SECUREPAY ATM</div>
          <div className="text-center text-xs text-muted">--- TRANSACTION SLIP ---</div>
          <Row k="DATE" v={new Date().toLocaleString("en-GB")} />
          <Row k="HOLDER" v={data.full_name} />
          <Row k="ACCT" v={data.account_no} />
          <Row k="TYPE" v={data.type} />
          {typeof data.amount === "number" && <Row k="AMOUNT" v={formatNGN(data.amount)} />}
          {data.recipient && <Row k="TO" v={data.recipient} />}
          <Row k="REF" v={data.reference} />
          <div className="my-2 border-t border-dashed border-[color:var(--border)]" />
          <Row k="NEW BAL" v={formatNGN(data.new_balance)} highlight />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded border border-accent bg-accent-dim py-2 text-xs tracking-widest text-accent hover:bg-accent hover:text-[color:var(--bg)]"
          >
            PRINT
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded border border-[color:var(--border)] py-2 text-xs tracking-widest hover:border-accent"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className={highlight ? "text-accent" : ""}>{v}</span>
    </div>
  );
}
