import { useCallback, useRef, useState } from "react";
import { Fingerprint, Upload } from "lucide-react";

type Props = {
  onPicked: (file: File, dataUrl: string) => void;
  status?: "WAITING" | "SCANNING" | "MATCHED" | "FAILED";
};

export function FingerprintUpload({ onPicked, status = "WAITING" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handle = useCallback(
    (f: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setPreview(url);
        onPicked(f, url);
      };
      reader.readAsDataURL(f);
    },
    [onPicked]
  );

  return (
    <div
      className={`relative flex h-64 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed transition ${
        drag ? "border-accent bg-accent-dim" : "border-[color:var(--border)] bg-panel"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handle(f);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
        }}
      />
      {preview ? (
        <>
          <img
            src={preview}
            alt="fingerprint"
            className="h-full w-full object-contain p-2 grayscale"
            style={{ filter: "grayscale(1) contrast(1.2)" }}
          />
          {status === "SCANNING" && <div className="scan-line" />}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted">
          <Fingerprint className="h-12 w-12 text-accent" />
          <div className="flex items-center gap-2 text-sm tracking-widest">
            <Upload className="h-4 w-4" /> DROP OR CLICK TO UPLOAD
          </div>
          <div className="text-xs">PNG · JPG · BMP</div>
        </div>
      )}
    </div>
  );
}
