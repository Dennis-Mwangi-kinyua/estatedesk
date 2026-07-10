import { AlertCircle, ClipboardList, Droplets, ListTodo } from "lucide-react";
import { CaretakerI18nFormat } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-format";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerTodayWorkPageData } from "../_lib/types";

function LocalizedNote({
  labelKey,
  values,
}: {
  labelKey: "dueTodayNote" | "inspectionsNote" | "meterPendingNote" | "urgentNote";
  values?: Record<string, string | number>;
}) {
  return (
    <span>
      {values ? (
        <CaretakerI18nFormat labelKey={labelKey} values={values} />
      ) : (
        <CaretakerI18nLabel labelKey={labelKey} />
      )}
    </span>
  );
}

export function TodayStats({
  data,
}: {
  data: Extract<CaretakerTodayWorkPageData, { ok: true }>;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={<CaretakerI18nLabel labelKey="dueToday" />}
        value={data.dueToday}
        note={<LocalizedNote labelKey="dueTodayNote" />}
        icon={ListTodo}
        href="/dashboard/caretaker/today"
      />
      <StatCard
        label={<CaretakerI18nLabel labelKey="inspectionsStat" />}
        value={data.inspectionsToday}
        note={<LocalizedNote labelKey="inspectionsNote" />}
        icon={ClipboardList}
        href="/dashboard/caretaker/inspections"
      />
      <StatCard
        label={<CaretakerI18nLabel labelKey="meterReadingsStat" />}
        value={data.meterPending}
        note={
          <LocalizedNote
            labelKey="meterPendingNote"
            values={{ period: data.period }}
          />
        }
        icon={Droplets}
        href="/dashboard/caretaker/water-bills/read"
        highlight={data.meterPending > 0 ? "warning" : "default"}
      />
      <StatCard
        label={<CaretakerI18nLabel labelKey="urgentIssuesStat" />}
        value={data.urgentCount}
        note={<LocalizedNote labelKey="urgentNote" />}
        icon={AlertCircle}
        href="/dashboard/caretaker/issues?priority=URGENT"
        highlight={data.urgentCount > 0 ? "warning" : "default"}
      />
    </section>
  );
}