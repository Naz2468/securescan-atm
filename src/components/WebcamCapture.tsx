import { forwardRef, useImperativeHandle, useRef } from "react";
import Webcam from "react-webcam";

export type WebcamHandle = {
  getVideo: () => HTMLVideoElement | null;
  getScreenshot: () => string | null;
};

export const WebcamCapture = forwardRef<WebcamHandle, { className?: string }>(
  function WebcamCapture({ className }, ref) {
    const camRef = useRef<Webcam>(null);
    useImperativeHandle(ref, () => ({
      getVideo: () => (camRef.current as unknown as { video: HTMLVideoElement } | null)?.video ?? null,
      getScreenshot: () => camRef.current?.getScreenshot() ?? null,
    }));

    return (
      <div className={`relative overflow-hidden rounded border border-[color:var(--border)] bg-black ${className ?? ""}`}>
        <Webcam
          ref={camRef}
          audio={false}
          mirrored
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
          className="block w-full"
          onUserMediaError={() => {
            /* handled visually by parent */
          }}
        />
        <div className="corner-brackets pointer-events-none absolute inset-0">
          <span className="br" />
        </div>
        <div className="scan-line" />
      </div>
    );
  }
);
