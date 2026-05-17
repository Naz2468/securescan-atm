import { useEffect, useState } from "react";

export function SessionTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, expiresAt - Date.now());
      setRemaining(r);
      if (r === 0) {
        clearInterval(id);
        onExpire();
      }
    }, 250);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const s = Math.ceil(remaining / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const low = s <= 15;
  return (
    <div
      className={`flex items-center gap-2 rounded border px-3 py-1 font-mono text-sm ${
        low ? "border-danger text-danger" : "border-accent text-accent"
      }`}
    >
      <span className="text-xs tracking-widest">SESSION</span>
      <span>{mm}:{ss}</span>
    </div>
  );
}
