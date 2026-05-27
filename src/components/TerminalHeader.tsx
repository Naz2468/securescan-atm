import { Link, useLocation } from "@tanstack/react-router";

const STEPS = [
  { path: "/", label: "Home" },
  { path: "/auth", label: "Verify" },
  { path: "/menu", label: "Account" },
  { path: "/logs", label: "Logs" },
  { path: "/about", label: "About" },
];

export function TerminalHeader({ step: _step }: { step?: number }) {
  const location = useLocation();
  const isActive = (p: string) =>
    p === "/" ? location.pathname === "/" : location.pathname.startsWith(p);

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[color:var(--bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent font-bold text-[color:var(--bg)]">S</span>
          <span className="text-base font-semibold tracking-tight">SecurePay</span>
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
        <Link
          to="/enroll"
          className="rounded-full border border-[color:var(--border)] px-4 py-1.5 text-sm hover:border-accent hover:text-accent"
        >
          Enroll
        </Link>
      </div>
    </header>
  );
}
