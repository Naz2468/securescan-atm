import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STEPS = [
  { path: "/", label: "WELCOME" },
  { path: "/auth", label: "VERIFY" },
  { path: "/menu", label: "TRANSACT" },
  { path: "/logs", label: "LOGS" },
];

export function TerminalHeader({ step }: { step?: number }) {
  const [time, setTime] = useState("--:--:--");
  const location = useLocation();
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const activeStep =
    step ??
    Math.max(
      0,
      STEPS.findIndex((s) =>
        s.path === "/" ? location.pathname === "/" : location.pathname.startsWith(s.path)
      )
    );

  return (
    <header className="border-b border-[color:var(--border)] bg-panel">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="pulse-dot" />
          <Link to="/" className="font-mono text-lg tracking-widest text-accent">
            SECUREPAY<span className="text-foreground">::ATM</span>
          </Link>
        </div>
        <nav className="hidden gap-1 md:flex">
          {STEPS.map((s, i) => (
            <Link
              key={s.path}
              to={s.path}
              className={`rounded px-3 py-1 text-xs tracking-widest ${
                i === activeStep
                  ? "bg-accent-dim text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {String(i + 1).padStart(2, "0")} · {s.label}
            </Link>
          ))}
          <Link
            to="/enroll"
            className="ml-2 rounded border border-[color:var(--border)] px-3 py-1 text-xs tracking-widest text-muted hover:text-accent"
          >
            ENROLL
          </Link>
        </nav>
        <div className="font-mono text-sm text-accent">{time}</div>
      </div>
      <div className="h-[2px] w-full bg-[color:var(--border)]">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </header>
  );
}
