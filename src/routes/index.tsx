import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, ShieldCheck, ScanFace, Fingerprint } from "lucide-react";

export const Route = createFileRoute("/")({
  component: WelcomePage,
});

const DEMO = ["0123456789", "0987654321", "1122334455"];

function WelcomePage() {
  const nav = useNavigate();
  const { setAccountNo } = useAuth();
  const [acct, setAcct] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const proceed = (acc: string) => {
    const v = acc.trim();
    if (!/^\d{6,20}$/.test(v)) return;
    setAccountNo(v);
    nav({ to: "/auth", search: { acct: v } });
  };

  return (
    <div className="min-h-screen bg-background font-mono text-foreground">
      <TerminalHeader step={0} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <div className="text-xs tracking-widest text-muted">// BOOT SEQUENCE OK</div>
            <h1 className="mt-1 text-3xl tracking-widest text-accent terminal-cursor sm:text-4xl">
              SECUREPAY ATM
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Two-factor biometric authentication using facial recognition and fingerprint
              matching. Insert your account number to begin.
            </p>
          </div>
          <div className="hidden text-right text-xs text-muted md:block">
            <div>NODE: TERM-01</div>
            <div className="text-accent">{time}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="2-FACTOR"
            text="Face AND fingerprint required — both factors must match."
          />
          <Feature
            icon={<ScanFace className="h-5 w-5" />}
            title="FACE-API.JS"
            text="128-D descriptor with Euclidean distance < 0.5 threshold."
          />
          <Feature
            icon={<Fingerprint className="h-5 w-5" />}
            title="OPENCV ORB"
            text="ORB keypoints + brute-force Hamming matching, in-browser."
          />
        </div>

        <section className="mt-8 rounded border border-[color:var(--border)] bg-panel p-6">
          <div className="text-xs tracking-widest text-muted">ENTER ACCOUNT NUMBER</div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              autoFocus
              inputMode="numeric"
              pattern="\d*"
              value={acct}
              onChange={(e) => setAcct(e.target.value.replace(/\D/g, "").slice(0, 20))}
              onKeyDown={(e) => e.key === "Enter" && proceed(acct)}
              placeholder="0000000000"
              className="flex-1 rounded border border-[color:var(--border)] bg-background px-4 py-3 font-mono text-lg tracking-widest outline-none focus:border-accent"
            />
            <button
              onClick={() => proceed(acct)}
              disabled={acct.length < 6}
              className="inline-flex items-center justify-center gap-2 rounded border border-accent bg-accent-dim px-6 py-3 text-sm tracking-widest text-accent transition hover:bg-accent hover:text-[color:var(--bg)] disabled:opacity-40"
            >
              PROCEED <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6">
            <div className="text-xs tracking-widest text-muted">QUICK-FILL · DEMO ACCOUNTS</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setAcct(d);
                    proceed(d);
                  }}
                  className="rounded border border-[color:var(--border)] px-3 py-1 text-xs tracking-widest text-muted hover:border-accent hover:text-accent"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-muted">
          Aba Peter Owoicho · BHU/22/04/09/0079 · Bingham University · Dept. of Cyber Security · 2026
        </p>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded border border-[color:var(--border)] bg-panel p-4">
      <div className="flex items-center gap-2 text-accent">{icon}<span className="text-xs tracking-widest">{title}</span></div>
      <p className="mt-2 text-xs text-muted">{text}</p>
    </div>
  );
}
