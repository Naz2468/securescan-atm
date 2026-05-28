import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const STEPS = [
  { path: "/", label: "Home" },
  { path: "/auth", label: "Verify" },
  { path: "/menu", label: "Account" },
  { path: "/logs", label: "Logs" },
  { path: "/about", label: "About" },
];

export function TerminalHeader({ step: _step }: { step?: number }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (p: string) =>
    p === "/" ? location.pathname === "/" : location.pathname.startsWith(p);

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[color:var(--bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent font-bold text-[color:var(--bg)]">S</span>
          <span className="text-base font-semibold tracking-tight sm:text-lg">SecurePay</span>
        </Link>

        <nav className="hidden gap-1 md:flex">
          {STEPS.map((s) => (
            <Link
              key={s.path}
              to={s.path}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                isActive(s.path)
                  ? "bg-accent text-[color:var(--bg)]"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            to="/enroll"
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-[color:var(--bg)] hover:opacity-90"
          >
            Sign Up
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-full bg-panel md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[color:var(--border)] bg-[color:var(--bg)] md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {STEPS.map((s) => (
              <Link
                key={s.path}
                to={s.path}
                onClick={() => setOpen(false)}
                className={`rounded-2xl px-4 py-2 text-sm ${
                  isActive(s.path) ? "bg-accent text-[color:var(--bg)]" : "text-muted"
                }`}
              >
                {s.label}
              </Link>
            ))}
            <Link
              to="/enroll"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-2xl bg-accent px-4 py-2 text-center text-sm font-medium text-[color:var(--bg)]"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
