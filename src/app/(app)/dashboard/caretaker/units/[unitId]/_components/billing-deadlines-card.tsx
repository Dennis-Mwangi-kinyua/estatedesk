import Link from "next/link";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  formatCurrency,
  formatDate,
} from "@/app/(app)/dashboard/caretaker/water-bills/_lib/helpers";
import { getBillHref } from "@/app/(app)/dashboard/caretaker/water-bills/_components/water-bills-ui";
import type { CaretakerUnitDetailPageData } from "../_lib/types";

export function BillingDeadlinesCard({
  data,
}: {
  data: Extract<CaretakerUnitDetailPageData, { ok: true }>;
}) {
  const now = new Date();
  const upcomingBills = data.unit.waterBills
    .filter(
      (bill) =>
        bill.dueDate >= now &&
        !["PAID_VERIFIED", "CANCELLED"].includes(bill.status),
    )
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Billing"
        title={<CaretakerI18nLabel labelKey="billingDeadlines" />}
      />
      <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
        {upcomingBills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
            <CaretakerI18nLabel labelKey="noDeadlines" />
          </div>
        ) : (
          upcomingBills.map((bill) => (
            <div
              key={bill.id}
              className="rounded-2xl border border-border bg-muted/10 p-4"
            >
              <p className="text-sm font-semibold text-foreground">
                {bill.period} · {formatCurrency(bill.total)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <CaretakerI18nLabel labelKey="due" /> {formatDate(bill.dueDate)}
                {" · "}
                {bill.status.replaceAll("_", " ")}
              </p>
              <Link
                href={getBillHref(bill.id)}
                className="mt-2 inline-flex text-sm font-semibold text-primary"
              >
                Open bill
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}