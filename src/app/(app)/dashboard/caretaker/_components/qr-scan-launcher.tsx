"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, X } from "lucide-react";

const UNIT_PATH_PATTERN = /\/dashboard\/caretaker\/units\/([^/?#]+)/;

type DetectedBarcode = { rawValue: string };

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

function extractUnitPath(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    const match = url.pathname.match(UNIT_PATH_PATTERN);
    return match ? `/dashboard/caretaker/units/${match[1]}` : null;
  } catch {
    const match = value.match(UNIT_PATH_PATTERN);
    return match ? `/dashboard/caretaker/units/${match[1]}` : null;
  }
}

export function QrScanLauncher({
  label = "Scan unit QR",
}: {
  label?: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const navigateToUnit = useCallback(
    (raw: string) => {
      const path = extractUnitPath(raw.trim());
      if (!path) {
        setError("QR code does not link to a caretaker unit profile.");
        return;
      }

      stopCamera();
      setOpen(false);
      setError(null);
      router.push(path);
    },
    [router, stopCamera],
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    let cancelled = false;
    let intervalId: number | undefined;
    const detectorAvailable =
      typeof window !== "undefined" && "BarcodeDetector" in window;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (!detectorAvailable) {
          setError("Camera ready. Paste a unit link below if scan is unavailable.");
          return;
        }

        const Detector = (window as Window & {
          BarcodeDetector?: BarcodeDetectorConstructor;
        }).BarcodeDetector;

        if (!Detector) {
          setError("Camera ready. Paste a unit link below if scan is unavailable.");
          return;
        }

        const detector = new Detector({ formats: ["qr_code"] });

        intervalId = window.setInterval(async () => {
          if (!videoRef.current) return;

          try {
            const codes = await detector.detect(videoRef.current);
            const match = codes.find((code) => extractUnitPath(code.rawValue));
            if (match) {
              navigateToUnit(match.rawValue);
            }
          } catch {
            // Ignore transient detection errors while camera warms up.
          }
        }, 700);
      } catch {
        setError("Camera access denied. Paste a unit link below instead.");
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      stopCamera();
    };
  }, [navigateToUnit, open, stopCamera]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/30"
        aria-label={label}
      >
        <QrCode className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-scan-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="qr-scan-title" className="text-lg font-semibold text-foreground">
                  Scan unit QR
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Point the camera at a unit QR code to open the profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border"
                aria-label="Close scanner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <video
              ref={videoRef}
              className="mt-4 aspect-square w-full rounded-2xl border border-border bg-black object-cover"
              muted
              playsInline
            />

            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                navigateToUnit(manualValue);
              }}
            >
              <label htmlFor="qr-manual-input" className="text-sm font-medium text-foreground">
                Or paste unit link
              </label>
              <input
                id="qr-manual-input"
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="https://…/dashboard/caretaker/units/…"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
              />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Open unit
              </button>
            </form>

            {error ? (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-200" role="status">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}