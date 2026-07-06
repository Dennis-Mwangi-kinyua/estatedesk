import { Search } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import { QrScanLauncher } from "@/app/(app)/dashboard/caretaker/_components/qr-scan-launcher";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

export function SearchHeader() {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <CaretakerI18nLabel labelKey="scopedLookup" />
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          <CaretakerI18nLabel labelKey="search" />
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          <CaretakerI18nLabel labelKey="searchSubtitle" />
        </p>

        <div className="mt-4">
          <QrScanLauncher label="Scan unit QR" />
        </div>

        <InAppGuideHint topic="caretaker" workspace="caretaker" />
      </div>
    </section>
  );
}