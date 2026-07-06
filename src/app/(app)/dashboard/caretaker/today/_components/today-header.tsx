import { CalendarDays } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { CaretakerI18nFormat } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-format";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerTodayWorkPageData } from "../_lib/types";

export function TodayHeader({
  data,
}: {
  data: Extract<CaretakerTodayWorkPageData, { ok: true }>;
}) {
  const dateLabel = new Intl.DateTimeFormat("en-KE", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <CaretakerI18nLabel labelKey="fieldCommandCenter" />
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          <CaretakerI18nLabel labelKey="todayTitle" />
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          {data.dueToday > 0 ? (
            <CaretakerI18nFormat
              labelKey="todayTasksQueued"
              values={{ count: data.dueToday, date: dateLabel }}
            />
          ) : (
            <CaretakerI18nFormat
              labelKey="todayQueueClear"
              values={{ date: dateLabel }}
            />
          )}
        </p>

        <InAppGuideHint topic="caretaker" workspace="caretaker" />
      </div>
    </section>
  );
}