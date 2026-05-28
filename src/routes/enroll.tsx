import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { WebcamCapture, type WebcamHandle } from "@/components/WebcamCapture";
import { FingerprintUpload } from "@/components/FingerprintUpload";
import { supabase } from "@/integrations/supabase/client";
import { loadFaceApi } from "@/lib/biometric-loaders";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { maskAccount } from "@/lib/format";

export const Route = createFileRoute("/enroll")({
  component: EnrollPage,
});

type Enrolled = {
  id: string;
  full_name: string;
  account_no: string;
  has_bio: boolean;
};

function EnrollPage() {
  const [modelsReady, setModelsReady] = useState(false);
  const [fullName, setFullName] = useState("");
  const [acct, setAcct] = useState("");
  const [fingerFile, setFingerFile] = useState<File | null>(null);
  const [fingerPreview, setFingerPreview] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState<number[] | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<Enrolled[]>([]);
  const camRef = useRef<WebcamHandle>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    loadFaceApi().then(() => setModelsReady(true)).catch((e) => setError(e.message));
  }, []);

  const refreshList = async () => {
    const { data: users } = await supabase
      .from("atm_users")
      .select("id, full_name, account_no")
      .order("created_at", { ascending: false });
    if (!users) return;
    const { data: bios } = await supabase.from("biometrics").select("user_id");
    const bioSet = new Set((bios ?? []).map((b) => b.user_id));
    setList(
      users.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        account_no: u.account_no,
        has_bio: bioSet.has(u.id),
      }))
    );
  };

  useEffect(() => {
    refreshList();
  }, []);

  const genAccount = () => {
    const v = Math.floor(1_000_000_000 + Math.random() * 9_000_000_000).toString();
    setAcct(v);
  };

  const capture = async () => {
    if (!modelsReady) return;
    setCapturing(true);
    setError(null);
    try {
      const faceapi = window.faceapi;
      const video = camRef.current?.getVideo();
      if (!video) throw new Error("camera not ready");
      const det = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!det) throw new Error("No face detected. Look directly at the camera.");
      setDescriptor(Array.from(det.descriptor));
    } catch (e) {
      setError((e as Error).message);
      setDescriptor(null);
    } finally {
      setCapturing(false);
    }
  };

  const enroll = async () => {
    setError(null);
    setSuccess(null);
    if (!fullName.trim()) return setError("Enter full name");
    if (!/^\d{6,20}$/.test(acct)) return setError("Account # must be 6-20 digits");
    if (!descriptor) return setError("Capture a face first");
    if (!fingerFile) return setError("Upload a fingerprint image");
    setEnrolling(true);
    try {
      // create/find user
      let userId: string;
      const { data: existing } = await supabase
        .from("atm_users")
        .select("id")
        .eq("account_no", acct)
        .maybeSingle();
      if (existing) {
        userId = existing.id;
      } else {
        const { data: created, error: cerr } = await supabase
          .from("atm_users")
          .insert({ full_name: fullName.trim(), account_no: acct, balance: 50000 })
          .select("id")
          .single();
        if (cerr || !created) throw new Error(cerr?.message || "user create failed");
        userId = created.id;
      }

      const path = `${userId}/${Date.now()}_${fingerFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uperr } = await supabase.storage
        .from("biometrics")
        .upload(path, fingerFile, { upsert: false, contentType: fingerFile.type });
      if (uperr) throw new Error(uperr.message);
      const { data: signed } = await supabase.storage
        .from("biometrics")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? "";

      const { error: berr } = await supabase.from("biometrics").insert({
        user_id: userId,
        face_descriptor: JSON.stringify(descriptor),
        fingerprint_url: url,
        fingerprint_path: path,
      });
      if (berr) throw new Error(berr.message);

      setSuccess(`Enrolled ${fullName.trim()} · ${acct}`);
      setFullName("");
      setAcct("");
      setDescriptor(null);
      setFingerFile(null);
      setFingerPreview(null);
      refreshList();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TerminalHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <div className="text-xs tracking-widest text-muted">SIGN UP</div>
          <h1 className="text-2xl font-semibold text-accent sm:text-3xl">Create your account</h1>
          <p className="mt-1 text-sm text-muted">
            Register your face and fingerprint. Both are required to sign in.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded border border-[color:var(--border)] bg-panel p-4">
            <div className="text-xs tracking-widest text-accent">USER DETAILS</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs text-muted">FULL NAME</div>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="mt-1 w-full rounded border border-[color:var(--border)] bg-background px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <div>
                <div className="text-xs text-muted">ACCOUNT NO</div>
                <div className="mt-1 flex gap-2">
                  <input
                    value={acct}
                    onChange={(e) => setAcct(e.target.value.replace(/\D/g, "").slice(0, 20))}
                    placeholder="0000000000"
                    className="flex-1 rounded border border-[color:var(--border)] bg-background px-3 py-2 tracking-widest outline-none focus:border-accent"
                  />
                  <button
                    onClick={genAccount}
                    className="rounded border border-[color:var(--border)] px-3 text-xs tracking-widest text-muted hover:border-accent hover:text-accent"
                  >
                    <RefreshCw className="inline h-3 w-3" /> GEN
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs tracking-widest text-accent">FACE CAPTURE</div>
            <div className="mt-2">
              {modelsReady ? (
                <>
                  <WebcamCapture ref={camRef} />
                  <button
                    onClick={capture}
                    disabled={capturing}
                    className="mt-3 w-full rounded border border-accent bg-accent-dim py-2 text-xs tracking-widest text-accent hover:bg-accent hover:text-[color:var(--bg)] disabled:opacity-40"
                  >
                    {capturing ? "DETECTING..." : descriptor ? "RE-CAPTURE" : "CAPTURE FACE"}
                  </button>
                  {descriptor && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-accent">
                      <Check className="h-3 w-3" /> Descriptor stored ({descriptor.length} dims)
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading face-api models…
                </div>
              )}
            </div>
          </section>

          <section className="rounded border border-[color:var(--border)] bg-panel p-4">
            <div className="text-xs tracking-widest text-accent">FINGERPRINT IMAGE</div>
            <div className="mt-2">
              <FingerprintUpload
                status={fingerFile ? "MATCHED" : "WAITING"}
                onPicked={(f, url) => {
                  setFingerFile(f);
                  setFingerPreview(url);
                }}
              />
              {fingerPreview && (
                <div className="mt-2 text-xs text-accent">
                  ✓ {fingerFile?.name} ready
                </div>
              )}
            </div>

            {error && <div className="mt-4 text-xs text-danger">⚠ {error}</div>}
            {success && <div className="mt-4 text-xs text-accent">✓ {success}</div>}

            <button
              onClick={enroll}
              disabled={enrolling}
              className="mt-6 w-full rounded border border-accent bg-accent py-3 text-sm font-bold tracking-widest text-[color:var(--bg)] hover:opacity-90 disabled:opacity-40"
            >
              {enrolling ? "ENROLLING..." : "ENROLL USER"}
            </button>
          </section>
        </div>

        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs tracking-widest text-muted">ENROLLED USERS</div>
            <button
              onClick={refreshList}
              className="text-xs text-muted hover:text-accent"
            >
              <RefreshCw className="inline h-3 w-3" /> REFRESH
            </button>
          </div>
          <div className="overflow-x-auto rounded border border-[color:var(--border)] bg-panel">
            <table className="w-full text-left text-xs">
              <thead className="bg-background text-muted">
                <tr>
                  <th className="px-3 py-2">NAME</th>
                  <th className="px-3 py-2">ACCOUNT</th>
                  <th className="px-3 py-2">BIOMETRICS</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-t border-[color:var(--border)]">
                    <td className="px-3 py-2">{u.full_name}</td>
                    <td className="px-3 py-2 text-muted">{maskAccount(u.account_no)}</td>
                    <td className={`px-3 py-2 ${u.has_bio ? "text-accent" : "text-warn"}`}>
                      {u.has_bio ? "ENROLLED" : "MISSING"}
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-muted">
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
