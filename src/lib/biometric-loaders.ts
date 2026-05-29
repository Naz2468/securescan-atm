// Browser-only loaders for face-api.js and OpenCV.js (CDN scripts).
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    faceapi?: any;
    cv?: any;
    cvReady?: boolean;
    __faceApiPromise?: Promise<any>;
    __opencvPromise?: Promise<any>;
  }
}

const FACE_API_SRC = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js";
const FACE_MODELS_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/";
const OPENCV_SRC = "https://docs.opencv.org/4.8.0/opencv.js";

function loadScript(src: string, onload?: () => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("no-document"));
    const existing = document.querySelector(`script[data-src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any).__loaded) {
        onload?.();
        return resolve();
      }
      existing.addEventListener("load", () => {
        onload?.();
        resolve();
      });
      existing.addEventListener("error", () => reject(new Error("script-load-fail")));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.src = src;
    s.onload = () => {
      (s as any).__loaded = true;
      onload?.();
      resolve();
    };
    s.onerror = () => reject(new Error("script-load-fail: " + src));
    document.head.appendChild(s);
  });
}

export async function loadFaceApi(): Promise<any> {
  if (typeof window === "undefined") throw new Error("face-api requires browser");
  if (window.faceapi && (window.faceapi as any).__modelsLoaded) return window.faceapi;
  if (window.__faceApiPromise) return window.__faceApiPromise;
  window.__faceApiPromise = (async () => {
    await loadScript(FACE_API_SRC);
    const faceapi = window.faceapi;
    if (!faceapi) throw new Error("face-api not on window");
    // TinyFaceDetector (~190KB) is ~10x faster to download than SSD MobileNet.
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODELS_URL),
    ]);
    (faceapi as any).__modelsLoaded = true;
    return faceapi;
  })();
  return window.__faceApiPromise;
}

export function detectorOptions(): any {
  const faceapi = window.faceapi;
  return new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
}


export async function loadOpenCV(): Promise<any> {
  if (typeof window === "undefined") throw new Error("opencv requires browser");
  if (window.cv && window.cvReady) return window.cv;
  if (window.__opencvPromise) return window.__opencvPromise;
  window.__opencvPromise = new Promise((resolve, reject) => {
    loadScript(OPENCV_SRC)
      .then(() => {
        const start = Date.now();
        const tick = () => {
          if (window.cv && (window.cv as any).Mat) {
            window.cvReady = true;
            resolve(window.cv);
          } else if (Date.now() - start > 30000) {
            reject(new Error("opencv-timeout"));
          } else {
            setTimeout(tick, 100);
          }
        };
        tick();
      })
      .catch(reject);
  });
  return window.__opencvPromise;
}

// ORB matching between two HTMLImageElements; returns { score, match, matches }
export async function compareFingerprints(
  imgA: HTMLImageElement,
  imgB: HTMLImageElement
): Promise<{ score: number; match: boolean; matchesCount: number }> {
  const cv = await loadOpenCV();
  const mat1 = cv.imread(imgA);
  const mat2 = cv.imread(imgB);
  const gray1 = new cv.Mat();
  const gray2 = new cv.Mat();
  cv.cvtColor(mat1, gray1, cv.COLOR_RGBA2GRAY);
  cv.cvtColor(mat2, gray2, cv.COLOR_RGBA2GRAY);
  const orb = new cv.ORB(500);
  const kp1 = new cv.KeyPointVector();
  const kp2 = new cv.KeyPointVector();
  const des1 = new cv.Mat();
  const des2 = new cv.Mat();
  const noMask = new cv.Mat();
  orb.detectAndCompute(gray1, noMask, kp1, des1);
  orb.detectAndCompute(gray2, noMask, kp2, des2);
  let goodCount = 0;
  if (!des1.empty() && !des2.empty()) {
    const bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
    const matches = new cv.DMatchVector();
    bf.match(des1, des2, matches);
    for (let i = 0; i < matches.size(); i++) {
      if (matches.get(i).distance < 60) goodCount++;
    }
    matches.delete();
    bf.delete();
  }
  const score = Math.min((goodCount / 50) * 100, 100);
  const match = goodCount >= 15;
  mat1.delete(); mat2.delete(); gray1.delete(); gray2.delete();
  kp1.delete(); kp2.delete(); des1.delete(); des2.delete(); noMask.delete(); orb.delete();
  return { score, match, matchesCount: goodCount };
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img-load-fail"));
    img.src = url;
  });
}
