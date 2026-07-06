import Link from "next/link";
import {
  buildCalendarDays,
  eventKindClasses,
  eventKindLabel,
} from "../_lib/helpers";
import type { CaretakerCalendarPageData } from "../_lib/types";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

export function CalendarWeekGrid({
  data,
}: {
  data: Extract<CaretakerCalendarPageData, { ok: true }>;
}) {
  const days = buildCalendarDays(data.weekStart, data.events);

  return (
    <section className={panelShellClassName}>
      <SectionIntro eyebrow="Schedule" title="This week" />
      <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-7 ${panelBodyClassName} pt-0`}>
        {days.map((day) => (
          <div
            key={day.key}
            className={`rounded-2xl border p-3 ${
              day.isToday
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/10"
            }`}
          >
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {day.weekday}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {day.label}
              </p>
            </div>

            <div className="space-y-2">
              {day.events.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tasks</p>
              ) : (
                day.events.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className={`block rounded-xl border px-2.5 py-2 text-xs transition hover:opacity-90 ${eventKindClasses(
                      event.kind,
                    )}`}
                  >
                    <p className="font-semibold">{event.title}</p>
                    <p className="mt-1 opacity-80">{eventKindLabel(event.kind)}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}