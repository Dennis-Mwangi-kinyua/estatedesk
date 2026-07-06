import { CaretakerI18nFormat } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-format";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerVendorsPageData } from "../_lib/types";

export function VendorsHeader({
  data,
}: {
  data: CaretakerVendorsPageData;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <p className="text-sm text-muted-foreground">
          <CaretakerI18nLabel labelKey="supplierDirectory" />
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          <CaretakerI18nLabel labelKey="vendorsTitle" />
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          <CaretakerI18nLabel labelKey="vendorsSubtitle" />
        </p>
        {data.ok ? (
          <p className="mt-4 text-sm font-medium text-foreground">
            <CaretakerI18nFormat
              labelKey="activeVendors"
              values={{ count: data.vendors.length }}
            />
          </p>
        ) : null}
      </div>
    </section>
  );
}