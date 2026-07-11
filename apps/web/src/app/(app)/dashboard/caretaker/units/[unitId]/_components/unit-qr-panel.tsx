"use client";

import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { InstallQrPanel } from "@/components/pwa/install-qr-panel";

export function UnitQrPanel({ profilePath }: { profilePath: string }) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Field access"
        title={<CaretakerI18nLabel labelKey="unitQr" />}
      />
      <div className={`${panelBodyClassName} pt-0`}>
        <p className="mb-3 text-sm text-muted-foreground">
          <CaretakerI18nLabel labelKey="scanToOpen" />
        </p>
        <InstallQrPanel
          targetUrl={profilePath}
          title="Unit / PWA QR"
          description="Laminate at the unit door or vacant entrance — opens the app without an app store."
          size={180}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </section>
  );
}