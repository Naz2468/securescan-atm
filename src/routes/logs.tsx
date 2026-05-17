import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/logs")({
  component: LogsPage,
});

type Log = {
  id: string;
  account_no: string | null;
  face_score: number | null;
  finger_score: number | null;
  auth_result: string | null;
  attempted_at: string;
};

function LogsPage() {
  const [rows, setRows] = useState<Log[] | null>(null);

  const load = async () => {
    setRows(null);
    const { data } = await supabase
      .from("auth_logs")
      .select("id, account_no, face_score, finger_score, auth_result, attempted_at")
      .order("attempted_at", { ascending: false })
      .limit(100);
    setRows(((data ?? []) as Log[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    if (!rows) return { total: 0, success: 0, failedToday: 0, rate: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const granted = rows.filter((r) => r.auth_result === "GRANTED").length;
    const failedToday = rows.filter(
      (r) => r.auth_result === "DENIED" && new Date(r.attempted_at) >= today
    ).length;
    return {
      total: rows.length,
      success: granted,
      failedToday,
      rate: rows.length ? Math.round((granted / rows.length) * 100) : 0,
    };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background font-mono">
      <TerminalHeader step={3} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest text-muted">// AUDIT TRAIL</div>
            <h1 className="text-2xl text-accent">Authentication Logs</h1>
          </div>
          <button
            onClick={load}
            className="rounded border border-[color:var(--border)] px-3 py-1 text-xs tracking-widest text-muted hover:border-accent hover:text-accent"
          >
            <RefreshCw className="inline h-3 w-3" /> REFRESH
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="TOTAL" value={stats.total} />
          <Stat label="GRANTED" value={stats.success} className="text-accent" />
          <Stat label="FAILED TODAY" value={stats.failedToday} className="text-danger" />
          <Stat label="SUCCESS RATE" value={`${stats.rate}%`} className="text-accent" />
        </div>

        <div className="overflow-x-auto rounded border border-[color:var(--border)] bg-panel">
          <table className="w-full text-left text-xs">
            <thead className="bg-background text-muted">
              <tr>
                <th className="px-3 py-2">TIMESTAMP</th>
                <th className="px-3 py-2">ACCOUNT</th>
                <th className="px-3 py-2">FACE</th>
                <th className="px-3 py-2">FINGER</th>
                <th className="px-3 py-2">RESULT</th>
              </tr>
            </thead>
            <tbody>
              {rows === null && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    <Loader2 className="inline h-4 w-4 animate-spin" /> Loading…
                  </td>
                </tr>
              )}
              {rows?.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t border-[color:var(--border)] ${
                    r.auth_result === "GRANTED"
                      ? "border-l-2 border-l-[color:var(--accent)]"
                      : "border-l-2 border-l-[color:var(--danger)]"
                  }`}
                >
                  <td className="px-3 py-2 text-muted">
                    {new Date(r.attempted_at).toLocaleString("en-GB")}
                  </td>
                  <td className="px-3 py-2">{r.account_no ?? "—"}</td>
                  <td className="px-3 py-2">
                    {r.face_score != null ? r.face_score.toFixed(1) + "%" : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.finger_score != null ? r.finger_score.toFixed(1) + "%" : "—"}
                  </td>
                  <td
                    className={`px-3 py-2 font-bold ${
                      r.auth_result === "GRANTED" ? "text-accent" : "text-danger"
                    }`}
                  >
                    {r.auth_result}
                  </td>
                </tr>
              ))}
              {rows?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    No authentication attempts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div className="rounded border border-[color:var(--border)] bg-panel p-4">
      <div className="text-xs tracking-widest text-muted">{label}</div>
      <div className={`mt-1 text-2xl ${className ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}
