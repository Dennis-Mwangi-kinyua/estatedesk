"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

export function UnitQrPanel({ profilePath }: { profilePath: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const profileUrl = `${window.location.origin}${profilePath}`;

    QRCode.toDataURL(profileUrl, {
      margin: 1,
      width: 180,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
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
  }, [profilePath]);

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Field access"
        title={<CaretakerI18nLabel labelKey="unitQr" />}
      />
      <div className={`${panelBodyClassName} pt-0`}>
        <p className="text-sm text-muted-foreground">
          <CaretakerI18nLabel labelKey="scanToOpen" />
        </p>
        <div className="mt-4 flex justify-center rounded-2xl border border-border bg-background p-4">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="Unit profile QR code"
              className="h-44 w-44 rounded-xl"
            />
          ) : (
            <div className="flex h-44 w-44 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              Generating QR…
            </div>
          )}
        </div>
      </div>
    </section>
  );
}