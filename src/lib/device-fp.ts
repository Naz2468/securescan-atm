// Real-time device fingerprint using FingerprintJS (open-source)
import FingerprintJS from "@fingerprintjs/fingerprintjs";

let fpPromise: Promise<{ get: () => Promise<{ visitorId: string; confidence: { score: number } }> }> | null = null;

export function loadDeviceFp() {
  if (!fpPromise) fpPromise = FingerprintJS.load() as never;
  return fpPromise!;
}

export async function getDeviceFingerprint(): Promise<{ visitorId: string; confidence: number }> {
  const fp = await loadDeviceFp();
  const result = await fp.get();
  return { visitorId: result.visitorId, confidence: result.confidence?.score ?? 0 };
}
