import { Truck } from "lucide-react";
import { ContactActions } from "@/app/(app)/dashboard/caretaker/_components/contact-actions";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import { ErrorStateCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { dispatchCaretakerVendorAction } from "../actions";
import type { CaretakerVendorsPageData } from "../_lib/types";

export function VendorsList({
  data,
  issueId,
}: {
  data: CaretakerVendorsPageData;
  issueId?: string;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow={<CaretakerI18nLabel labelKey="vendorDirectory" />}
        title={<CaretakerI18nLabel labelKey="approvedVendors" />}
      />
      <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : data.vendors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
            <CaretakerI18nLabel labelKey="noVendorsConfigured" />
          </div>
        ) : (
          data.vendors.map((vendor) => (
            <article
              key={vendor.id}
              className="rounded-2xl border border-border bg-muted/10 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                  <Truck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {vendor.name}
                  </p>
                  {vendor.contactPerson ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {vendor.contactPerson}
                    </p>
                  ) : null}

                  <div className="mt-3">
                    <ContactActions
                      phone={vendor.phone}
                      email={vendor.email}
                      compact
                    />
                  </div>

                  {issueId ? (
                    <form
                      action={dispatchCaretakerVendorAction}
                      className="mt-4 space-y-2"
                    >
                      <input type="hidden" name="issueId" value={issueId} />
                      <input type="hidden" name="vendorId" value={vendor.id} />
                      <input
                        name="notes"
                        placeholder="Optional dispatch notes"
                        aria-label="Optional vendor dispatch notes"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/40"
                      />
                      <button
                        type="submit"
                        className="inline-flex rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                      >
                        <CaretakerI18nLabel labelKey="requestVendorForIssue" />
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}