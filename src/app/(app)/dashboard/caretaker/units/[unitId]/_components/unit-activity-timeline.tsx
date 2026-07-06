import Link from "next/link";
import { Droplets, Wrench } from "lucide-react";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import { getCaretakerIssueHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  formatCurrency,
  formatDate,
} from "@/app/(app)/dashboard/caretaker/water-bills/_lib/helpers";
import { getBillHref, getReadingHref } from "@/app/(app)/dashboard/caretaker/water-bills/_components/water-bills-ui";
import type { CaretakerUnitDetailPageData } from "../_lib/types";

type TimelineItem = {
  id: string;
  kind: "issue" | "meter" | "bill";
  title: string;
  subtitle: string;
  date: Date;
  href: string;
};

export function UnitActivityTimeline({
  data,
}: {
  data: Extract<CaretakerUnitDetailPageData, { ok: true }>;
}) {
  const { unit } = data;

  const items: TimelineItem[] = [
    ...unit.issues.map((issue) => ({
      id: `issue-${issue.id}`,
      kind: "issue" as const,
      title: issue.title,
      subtitle: `${issue.status.replaceAll("_", " ")} · ${issue.priority}`,
      date: issue.updatedAt,
      href: getCaretakerIssueHref(issue.id),
    })),
    ...unit.meterReadings.map((reading) => ({
      id: `meter-${reading.id}`,
      kind: "meter" as const,
      title: `Meter reading · ${reading.period}`,
      subtitle: `${reading.currentReading} units · ${reading.status}`,
      date: reading.createdAt,
      href: getReadingHref(reading.id),
    })),
    ...unit.waterBills.map((bill) => ({
      id: `bill-${bill.id}`,
      kind: "bill" as const,
      title: `Water bill · ${bill.period}`,
      subtitle: `${formatCurrency(bill.total)} · ${bill.status.replaceAll("_", " ")}`,
      date: bill.dueDate,
      href: getBillHref(bill.id),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="History"
        title={<CaretakerI18nLabel labelKey="activityTimeline" />}
      />
      <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
            <CaretakerI18nLabel labelKey="noActivity" />
          </div>
        ) : (
          items.map((item) => {
            const Icon = item.kind === "issue" ? Wrench : Droplets;

            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-start gap-3 rounded-2xl border border-border bg-muted/10 p-4 transition hover:border-primary/25 hover:bg-muted/20"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(item.date)}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}