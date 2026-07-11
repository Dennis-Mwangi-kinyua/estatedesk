"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type InstallQrPanelProps = {
  /** Absolute or path URL that launches the PWA / vacancy / unit onboarding */
  targetUrl: string;
  title?: string;
  description?: string;
  /** Print-friendly larger QR for laminated entrance codes */
  size?: number;
  className?: string;
};

/**
 * Frictionless QR onboarding: scan opens PWA/web without an app store.
 * Use at vacant building entrances or on unit doors.
 */
export function InstallQrPanel({
  targetUrl,
  title = "Scan to open EstateDesk",
  description = "Opens the web app instantly — no app store download required.",
  size = 200,
  className = "",
}: InstallQrPanelProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [absoluteUrl, setAbsoluteUrl] = useState(targetUrl);

  useEffect(() => {
    let active = true;
    const resolved =
      targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
        ? targetUrl
        : `${window.location.origin}${targetUrl.startsWith("/") ? "" : "/"}${targetUrl}`;

    setAbsoluteUrl(resolved);

    QRCode.toDataURL(resolved, {
      margin: 1,
      width: size,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl(null);
      });

    return () => {
      active = false;
    };
  }, [targetUrl, size]);

  const printHint = useMemo(
    () => "Laminate and post at the entrance. Tenants scan to apply or install.",
    [],
  );

  return (
    <section
      className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="rounded-2xl border border-border bg-background p-3">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="QR code to open EstateDesk"
              className="rounded-xl"
              width={size}
              height={size}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground"
              style={{ width: size, height: size }}
            >
              Generating QR…
            </div>
          )}
        </div>
        <p className="max-w-xs text-center text-[11px] text-muted-foreground">
          {printHint}
        </p>
        <a
          href={absoluteUrl}
          className="break-all text-center text-[11px] font-medium text-teal-700 underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {absoluteUrl}
        </a>
        {dataUrl ? (
          <a
            href={dataUrl}
            download="estatedesk-entrance-qr.png"
            className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Download QR PNG
          </a>
        ) : null}
      </div>
    </section>
  );
}
