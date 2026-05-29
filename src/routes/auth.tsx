import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { TerminalHeader } from "@/components/TerminalHeader";
import { WebcamCapture, type WebcamHandle } from "@/components/WebcamCapture";
import { BiometricStatus, type FactorStatus } from "@/components/BiometricStatus";
import { useAuth } from "@/contexts/AuthContext";
import { useServerFn } from "@tanstack/react-start";
import { authenticate } from "@/lib/atm.functions";
import { supabase } from "@/integrations/supabase/client";
import { loadFaceApi, detectorOptions } from "@/lib/biometric-loaders";
import { getDeviceFingerprint, loadDeviceFp } from "@/lib/device-fp";
import { Check, Fingerprint, Loader2, ScanFace, X } from "lucide-react";
import { maskAccount, formatNGN } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ acct: z.string().optional() }),
  component: AuthPage,
});

type Result = {
  granted: boolean;
  reason?: string;
  face_match: boolean;
  face_score: number;
  finger_match: boolean;
  finger_score: number;
  session_token?: string;
  session_expires_at?: string;
  user?: { id: string; full_name: string; account_no: string; balance: number };
};

function AuthPage() {
  const search = Route.useSearch();
  const { accountNo, setAccountNo, setUser, setSession } = useAuth();
  const acct = (search.acct ?? accountNo ?? "").trim();
  const nav = useNavigate();

  useEffect(() => {
    if (search.acct && search.acct !== accountNo) setAccountNo(search.acct);
  }, [search.acct, accountNo, setAccountNo]);

  const [modelsReady, setModelsReady] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Loading face models…");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    // Warm up FingerprintJS in parallel (it's tiny, <50KB)
    loadDeviceFp().catch(() => {});
    (async () => {
      try {
        setLoadingMsg("Loading face recognition…");
        await loadFaceApi();
        if (cancelled) return;
        setModelsReady(true);
      } catch (e) {
        setModelsError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Face state
  const camRef = useRef<WebcamHandle>(null);
  const [faceStatus, setFaceStatus] = useState<FactorStatus>("IDLE");
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);

  // Device fingerprint state
  const [fingerStatus, setFingerStatus] = useState<FactorStatus>("WAITING");
  const [fingerScore, setFingerScore] = useState<number | null>(null);
  const [fingerMatch, setFingerMatch] = useState<boolean>(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [storedVisitorId, setStoredVisitorId] = useState<string | null>(null);

  // Auth call
  const authFn = useServerFn(authenticate);
  const [authing, setAuthing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState<string[]>([]);

  // Fetch stored device fingerprint for this account
  useEffect(() => {
    if (!acct) return;
    let cancelled = false;
    (async () => {
      const { data: user } = await supabase
        .from("atm_users")
        .select("id")
        .eq("account_no", acct)
        .maybeSingle();
      if (!user) return;
      const { data: bio } = await supabase
        .from("biometrics")
        .select("device_fp")
        .eq("user_id", user.id)
        .order("registered_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (bio?.device_fp) setStoredVisitorId(bio.device_fp);
    })();
    return () => {
      cancelled = true;
    };
  }, [acct]);

  const captureFace = async () => {
    if (!modelsReady) return;
    setFaceStatus("DETECTING");
    try {
      const faceapi = window.faceapi;
      const video = camRef.current?.getVideo();
      if (!video) throw new Error("camera not ready");
      setFaceStatus("PROCESSING");
      const detection = await faceapi
        .detectSingleFace(video, detectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        setFaceStatus("FAILED");
        setFaceDescriptor(null);
        return;
      }
      setFaceDescriptor(Array.from(detection.descriptor));
      setFaceStatus("MATCHED");
    } catch (e) {
      console.error(e);
      setFaceStatus("FAILED");
      setFaceDescriptor(null);
    }
  };

  const scanFingerprint = async () => {
    setFingerStatus("SCANNING");
    setFingerScore(null);
    setFingerMatch(false);
    try {
      const { visitorId: vid, confidence } = await getDeviceFingerprint();
      setVisitorId(vid);
      const match = !!storedVisitorId && vid === storedVisitorId;
      const score = match ? Math.round(confidence * 100) : 0;
      setFingerScore(score);
      setFingerMatch(match);
      setFingerStatus(match ? "MATCHED" : "FAILED");
    } catch (e) {
      console.error(e);
      setFingerStatus("FAILED");
      setFingerScore(0);
    }
  };

  const canAuthenticate =
    !!faceDescriptor && fingerStatus !== "WAITING" && fingerStatus !== "SCANNING" && !!acct;

  const runAuth = async () => {
    if (!canAuthenticate || !faceDescriptor) return;
    setAuthing(true);
    setProgress([]);
    const push = (s: string) => setProgress((p) => [...p, s]);
    try {
      push("> connecting secure channel...");
      await new Promise((r) => setTimeout(r, 200));
      push("> verifying biometric vectors...");
      const r = (await authFn({
        data: {
          account_no: acct,
          face_descriptor: faceDescriptor,
          finger_score: fingerScore ?? 0,
          finger_match: fingerMatch,
        },
      })) as Result;
      push(r.granted ? "> ACCESS GRANTED" : "> ACCESS DENIED");
      setResult(r);
      if (r.granted && r.session_token && r.session_expires_at && r.user) {
        setUser(r.user);
        setSession(r.session_token, new Date(r.session_expires_at).getTime());
        setTimeout(() => nav({ to: "/menu" }), 2000);
      }
    } catch (e) {
      push("> ERROR: " + (e as Error).message);
      setResult({
        granted: false,
        reason: (e as Error).message,
        face_match: false,
        face_score: 0,
        finger_match: false,
        finger_score: 0,
      });
    } finally {
      setAuthing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setFaceStatus("IDLE");
    setFaceDescriptor(null);
    setFingerStatus("WAITING");
    setFingerScore(null);
    setFingerMatch(false);
    setVisitorId(null);
    setProgress([]);
  };

  if (!acct) {
    return (
      <div className="min-h-screen bg-background">
        <TerminalHeader step={1} />
        <main className="mx-auto max-w-md px-5 py-16 text-center">
          <p className="text-warn">No account number provided</p>
          <a href="/" className="mt-4 inline-block text-accent underline">
            ← Back to home
          </a>
        </main>
      </div>
    );
  }

  if (!modelsReady) {
    return (
      <div className="min-h-screen bg-background">
        <TerminalHeader step={1} />
        <main className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <div className="mt-6 text-sm text-accent">{loadingMsg}</div>
          {modelsError && <div className="mt-4 text-sm text-danger">Error: {modelsError}</div>}
        </main>
      </div>
    );
  }

  if (result) {
    return <AuthResult result={result} onRetry={reset} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TerminalHeader step={1} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">Verifying</div>
            <div className="text-lg font-medium sm:text-xl">{maskAccount(acct)}</div>
          </div>
          <a href="/" className="text-sm text-muted hover:text-accent">Cancel</a>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl bg-panel p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-dim text-accent">
                  <ScanFace className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">Face</span>
              </div>
              <span className="text-xs text-muted">{faceStatus}</span>
            </div>
            <WebcamCapture ref={camRef} />
            <button
              onClick={captureFace}
              disabled={faceStatus === "PROCESSING" || faceStatus === "DETECTING"}
              className="mt-3 w-full rounded-full bg-accent-dim py-2.5 text-sm text-accent hover:bg-accent hover:text-[color:var(--bg)] disabled:opacity-40"
            >
              {faceStatus === "MATCHED" ? "Re-capture" : "Capture face"}
            </button>
          </section>

          <section className="rounded-3xl bg-panel p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-dim text-accent">
                  <Fingerprint className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">Device fingerprint</span>
              </div>
              <span className="text-xs text-muted">{fingerStatus}</span>
            </div>
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--border)] bg-background p-4 text-center">
              <Fingerprint
                className={`h-16 w-16 ${
                  fingerStatus === "MATCHED"
                    ? "text-accent"
                    : fingerStatus === "FAILED"
                    ? "text-danger"
                    : "text-muted"
                } ${fingerStatus === "SCANNING" ? "animate-pulse" : ""}`}
              />
              <div className="mt-3 text-xs text-muted">
                Real-time browser fingerprint (FingerprintJS)
              </div>
              {visitorId && (
                <div className="mt-2 font-mono text-[10px] text-muted">
                  ID: {visitorId.slice(0, 12)}…
                </div>
              )}
            </div>
            <button
              onClick={scanFingerprint}
              disabled={fingerStatus === "SCANNING"}
              className="mt-3 w-full rounded-full bg-accent-dim py-2.5 text-sm text-accent hover:bg-accent hover:text-[color:var(--bg)] disabled:opacity-40"
            >
              {fingerStatus === "SCANNING"
                ? "Scanning…"
                : fingerStatus === "MATCHED" || fingerStatus === "FAILED"
                ? "Re-scan"
                : "Scan fingerprint"}
            </button>
            {!storedVisitorId && (
              <div className="mt-3 text-xs text-warn">
                No device fingerprint enrolled for this account.{" "}
                <a href="/enroll" className="underline">Sign up first</a>
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-panel p-5 sm:p-6 lg:col-span-2">
            <BiometricStatus
              faceStatus={faceStatus}
              faceScore={faceDescriptor ? null : null}
              fingerStatus={fingerStatus}
              fingerScore={fingerScore}
            />
            <button
              onClick={runAuth}
              disabled={!canAuthenticate || authing}
              className="mt-4 w-full rounded-full bg-accent py-3 text-sm font-medium text-[color:var(--bg)] hover:opacity-90 disabled:opacity-30 sm:py-3.5 sm:text-base"
            >
              {authing ? "Authenticating…" : "Authenticate"}
            </button>
            {progress.length > 0 && (
              <pre className="mt-3 max-h-32 overflow-auto rounded-2xl bg-background p-3 text-xs text-accent">
                {progress.join("\n")}
              </pre>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}


function AuthResult({ result, onRetry }: { result: Result; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background font-mono">
      <TerminalHeader step={1} />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12 text-center">
        {result.granted ? (
          <>
            <div className="glow-in rounded-full border-2 border-accent p-6">
              <Check className="h-16 w-16 text-accent" />
            </div>
            <h1 className="mt-6 text-3xl tracking-widest text-accent">ACCESS GRANTED</h1>
            {result.user && (
              <div className="mt-4 text-sm text-muted">
                <div className="text-foreground">{result.user.full_name}</div>
                <div>{maskAccount(result.user.account_no)}</div>
                <div className="mt-1 text-accent">{formatNGN(result.user.balance)}</div>
              </div>
            )}
            <div className="mt-6 text-xs text-muted">Loading transaction menu...</div>
          </>
        ) : (
          <>
            <div className="shake-in rounded-full border-2 border-danger p-6">
              <X className="h-16 w-16 text-danger" />
            </div>
            <h1 className="mt-6 text-3xl tracking-widest text-danger">ACCESS DENIED</h1>
            <div className="mt-2 text-sm text-warn">{result.reason ?? "Authentication failed"}</div>
            <table className="mt-6 w-full max-w-md border border-[color:var(--border)] text-left text-xs">
              <thead className="bg-panel text-muted">
                <tr>
                  <th className="px-3 py-2">FACTOR</th>
                  <th className="px-3 py-2">SCORE</th>
                  <th className="px-3 py-2">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <Row label="FACE" score={result.face_score} ok={result.face_match} />
                <Row label="FINGERPRINT" score={result.finger_score} ok={result.finger_match} />
              </tbody>
            </table>
            <button
              onClick={onRetry}
              className="mt-6 rounded border border-accent bg-accent-dim px-6 py-2 text-xs tracking-widest text-accent hover:bg-accent hover:text-[color:var(--bg)]"
            >
              TRY AGAIN
            </button>
          </>
        )}
      </main>
    </div>
  );
}

function Row({ label, score, ok }: { label: string; score: number; ok: boolean }) {
  return (
    <tr className="border-t border-[color:var(--border)]">
      <td className="px-3 py-2">{label}</td>
      <td className="px-3 py-2">{score.toFixed(1)}%</td>
      <td className={`px-3 py-2 ${ok ? "text-accent" : "text-danger"}`}>
        {ok ? "MATCH" : "FAIL"}
      </td>
    </tr>
  );
}
