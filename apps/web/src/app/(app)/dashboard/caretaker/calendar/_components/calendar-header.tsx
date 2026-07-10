import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  buildCalendarWeekHref,
  formatWeekLabel,
  shiftWeek,
} from "../_lib/helpers";
import type { CaretakerCalendarPageData } from "../_lib/types";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

export function CalendarHeader({
  data,
}: {
  data: Extract<CaretakerCalendarPageData, { ok: true }>;
}) {
  const prevWeek = buildCalendarWeekHref(shiftWeek(data.weekStart, -1));
  const nextWeek = buildCalendarWeekHref(shiftWeek(data.weekStart, 1));

  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <p className="text-sm text-muted-foreground">Field schedule</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Weekly calendar
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Inspections, meter readings, move-outs, and billing deadlines in your
          assigned scope.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={prevWeek}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous week
          </Link>
          <span className="rounded-2xl border border-border bg-muted/10 px-4 py-2 text-sm font-semibold text-foreground">
            {formatWeekLabel(data.weekStart)}
          </span>
          <Link
            href={nextWeek}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            Next week
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}