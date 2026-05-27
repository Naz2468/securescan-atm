import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, ScanFace, Fingerprint, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: WelcomePage,
});

const DEMO = ["0123456789", "0987654321", "1122334455"];

function WelcomePage() {
  const nav = useNavigate();
  const { setAccountNo } = useAuth();
  const [acct, setAcct] = useState("");

  const proceed = (acc: string) => {
    const v = acc.trim();
    if (!/^\d{6,20}$/.test(v)) return;
    setAccountNo(v);
    nav({ to: "/auth", search: { acct: v } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TerminalHeader step={0} />
      <main className="mx-auto max-w-md px-5 pb-16 pt-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#9bef5a] via-[#5ed47a] to-[#1f2e26] p-6 text-[color:var(--bg)] shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs opacity-70">Secure ATM</div>
              <h1 className="mt-1 text-3xl font-semibold leading-tight">
                Sign in with<br />your biometrics
              </h1>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--bg)]/15">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-10 flex items-end justify-between">
            <div>
              <div className="text-[11px] opacity-70">Two-factor</div>
              <div className="text-lg font-medium">Face + Fingerprint</div>
            </div>
            <div className="flex -space-x-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--bg)]/20">
                <ScanFace className="h-4 w-4" />
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--bg)]/20">
                <Fingerprint className="h-4 w-4" />
              </span>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl bg-panel p-5">
          <label className="text-xs text-muted">Account number</label>
          <input
            autoFocus
            inputMode="numeric"
            value={acct}
            onChange={(e) => setAcct(e.target.value.replace(/\D/g, "").slice(0, 20))}
            onKeyDown={(e) => e.key === "Enter" && proceed(acct)}
            placeholder="0000000000"
            className="mt-2 w-full bg-transparent text-2xl tracking-wider outline-none placeholder:text-muted/60"
          />
          <button
            onClick={() => proceed(acct)}
            disabled={acct.length < 6}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-medium text-[color:var(--bg)] transition hover:opacity-90 disabled:opacity-40"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        <section className="mt-5">
          <div className="mb-2 text-xs text-muted">Demo accounts</div>
          <div className="flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setAcct(d);
                  proceed(d);
                }}
                className="rounded-full bg-panel px-4 py-2 text-sm text-muted hover:text-accent"
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-[11px] text-muted">
          Aba Peter Owoicho · Bingham University · 2026
        </p>
      </main>
    </div>
  );
}
