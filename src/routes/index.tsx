import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, ScanFace, Fingerprint, ShieldCheck, UserPlus, LogIn } from "lucide-react";

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
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:pt-14">
        <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#9bef5a] via-[#5ed47a] to-[#1f2e26] p-6 text-[color:var(--bg)] shadow-2xl sm:p-8 lg:min-h-[460px] lg:p-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs opacity-70 sm:text-sm">Secure ATM</div>
                <h1 className="mt-1 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                  Sign in with<br />your biometrics
                </h1>
                <p className="mt-3 max-w-md text-sm opacity-80 sm:text-base">
                  Two-factor ATM access using facial recognition and fingerprint matching.
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--bg)]/15 sm:h-12 sm:w-12">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
            </div>

            <div className="mt-10 flex items-end justify-between lg:mt-20">
              <div>
                <div className="text-[11px] opacity-70 sm:text-xs">Two-factor</div>
                <div className="text-lg font-medium sm:text-xl">Face + Fingerprint</div>
              </div>
              <div className="flex -space-x-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--bg)]/20 sm:h-11 sm:w-11">
                  <ScanFace className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--bg)]/20 sm:h-11 sm:w-11">
                  <Fingerprint className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              </div>
            </div>
          </section>

          {/* Right column: sign in + sign up */}
          <div className="space-y-5">
            <section className="rounded-3xl bg-panel p-5 sm:p-6">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                <LogIn className="h-4 w-4 text-accent" /> Sign in
              </div>
              <label className="text-xs text-muted">Account number</label>
              <input
                autoFocus
                inputMode="numeric"
                value={acct}
                onChange={(e) => setAcct(e.target.value.replace(/\D/g, "").slice(0, 20))}
                onKeyDown={(e) => e.key === "Enter" && proceed(acct)}
                placeholder="0000000000"
                className="mt-2 w-full bg-transparent text-2xl tracking-wider outline-none placeholder:text-muted/60 sm:text-3xl"
              />
              <button
                onClick={() => proceed(acct)}
                disabled={acct.length < 6}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-medium text-[color:var(--bg)] transition hover:opacity-90 disabled:opacity-40"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-5">
                <div className="mb-2 text-xs text-muted">Demo accounts</div>
                <div className="flex flex-wrap gap-2">
                  {DEMO.map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setAcct(d);
                        proceed(d);
                      }}
                      className="rounded-full bg-[color:var(--panel-2)] px-3 py-1.5 text-xs text-muted hover:text-accent sm:text-sm"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-panel p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UserPlus className="h-4 w-4 text-accent" /> New here?
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Register your face and fingerprint to open an account.
                  </p>
                </div>
                <Link
                  to="/enroll"
                  className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-[color:var(--bg)] hover:opacity-90"
                >
                  Sign Up
                </Link>
              </div>
            </section>
          </div>
        </div>

        <p className="mt-12 text-center text-[11px] text-muted">
          Aba Peter Owoicho · Bingham University · 2026
        </p>
      </main>
    </div>
  );
}
