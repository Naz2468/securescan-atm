import { Check, Loader2, ScanFace, Fingerprint, X } from "lucide-react";

export type FactorStatus = "IDLE" | "DETECTING" | "PROCESSING" | "MATCHED" | "FAILED" | "WAITING" | "SCANNING";

function Icon({ status }: { status: FactorStatus }) {
  if (status === "MATCHED") return <Check className="h-4 w-4 text-accent" />;
  if (status === "FAILED") return <X className="h-4 w-4 text-danger" />;
  if (status === "PROCESSING" || status === "DETECTING" || status === "SCANNING")
    return <Loader2 className="h-4 w-4 animate-spin text-warn" />;
  return <span className="h-2 w-2 rounded-full bg-[color:var(--muted)]" />;
}

function color(status: FactorStatus) {
  if (status === "MATCHED") return "border-accent text-accent";
  if (status === "FAILED") return "border-danger text-danger";
  if (status === "PROCESSING" || status === "DETECTING" || status === "SCANNING") return "border-warn text-warn";
  return "border-[color:var(--border)] text-muted";
}

export function FactorChip({
  kind,
  status,
  score,
}: {
  kind: "FACE" | "FINGER";
  status: FactorStatus;
  score?: number | null;
}) {
  return (
    <div className={`flex items-center gap-3 rounded border bg-panel px-3 py-2 ${color(status)}`}>
      {kind === "FACE" ? <ScanFace className="h-4 w-4" /> : <Fingerprint className="h-4 w-4" />}
      <div className="text-xs tracking-widest">{kind}</div>
      <div className="ml-2 flex items-center gap-2 text-xs">
        <Icon status={status} />
        <span>{status}</span>
      </div>
      <div className="ml-auto text-xs">
        {typeof score === "number" ? `${score.toFixed(1)}%` : "--.-%"}
      </div>
    </div>
  );
}

export function BiometricStatus({
  faceStatus,
  faceScore,
  fingerStatus,
  fingerScore,
}: {
  faceStatus: FactorStatus;
  faceScore: number | null;
  fingerStatus: FactorStatus;
  fingerScore: number | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <FactorChip kind="FACE" status={faceStatus} score={faceScore} />
      <FactorChip kind="FINGER" status={fingerStatus} score={fingerScore} />
    </div>
  );
}
