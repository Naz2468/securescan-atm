import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AtmUser = {
  id: string;
  full_name: string;
  account_no: string;
  balance: number;
};

type AuthState = {
  accountNo: string;
  setAccountNo: (v: string) => void;
  user: AtmUser | null;
  setUser: (u: AtmUser | null) => void;
  sessionToken: string | null;
  sessionExpiry: number | null; // epoch ms
  setSession: (token: string | null, expiry: number | null) => void;
  clearSession: () => void;
};

const Ctx = createContext<AuthState | null>(null);

const STORAGE_KEY = "securepay_session_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accountNo, setAccountNo] = useState("");
  const [user, setUser] = useState<AtmUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p?.sessionExpiry && p.sessionExpiry > Date.now()) {
        setUser(p.user ?? null);
        setSessionToken(p.sessionToken ?? null);
        setSessionExpiry(p.sessionExpiry ?? null);
        setAccountNo(p.user?.account_no ?? "");
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setSession = (token: string | null, expiry: number | null) => {
    setSessionToken(token);
    setSessionExpiry(expiry);
    if (typeof window !== "undefined") {
      if (token && expiry) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ sessionToken: token, sessionExpiry: expiry, user })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const clearSession = () => {
    setUser(null);
    setSessionToken(null);
    setSessionExpiry(null);
    setAccountNo("");
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  // Persist user updates (balance changes etc.) while session is active
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionToken && sessionExpiry && user) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sessionToken, sessionExpiry, user })
      );
    }
  }, [user, sessionToken, sessionExpiry]);

  return (
    <Ctx.Provider
      value={{
        accountNo,
        setAccountNo,
        user,
        setUser,
        sessionToken,
        sessionExpiry,
        setSession,
        clearSession,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
