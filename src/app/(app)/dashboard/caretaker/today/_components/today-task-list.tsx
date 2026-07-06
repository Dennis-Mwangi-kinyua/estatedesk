import { ArrowRight, ClipboardList, Droplets, Wrench } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import { IssueSlaBadge } from "@/app/(app)/dashboard/caretaker/_components/issue-sla-badge";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerI18nKey } from "@/app/(app)/dashboard/caretaker/_lib/i18n";
import type { TodayTask } from "../_lib/types";

const kindMeta = {
  inspection: {
    icon: ClipboardList,
    labelKey: "taskInspection" as const,
    tone: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200",
  },
  meter_reading: {
    icon: Droplets,
    labelKey: "taskMeterReading" as const,
    tone: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
  },
  issue: {
    icon: Wrench,
    labelKey: "taskIssue" as const,
    tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  },
} as const;

const priorityTone = {
  urgent: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
  high: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200",
  normal: "border-border bg-muted/20 text-muted-foreground",
} as const;

const actionLabelKeys: Record<string, CaretakerI18nKey> = {
  "Start inspection": "startInspection",
  "Enter reading": "enterReading",
  "Start work": "startWork",
  "Update issue": "updateIssue",
};

const dueLabelKeys: Record<string, CaretakerI18nKey> = {
  "Assigned to you": "assignedToYou",
  "In your scope": "inYourScope",
};

function TodayTaskCard({ task }: { task: TodayTask }) {
  const meta = kindMeta[task.kind];
  const Icon = meta.icon;
  const actionKey = actionLabelKeys[task.actionLabel];
  const dueKey = dueLabelKeys[task.dueLabel];

  return (
    <DeferredLink
      href={task.href}
      className="group block rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/10 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}
              >
                <CaretakerI18nLabel labelKey={meta.labelKey} />
              </span>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${priorityTone[task.priority]}`}
              >
                {task.priority}
              </span>
              {task.issueSla ? (
                <IssueSlaBadge
                  createdAt={task.issueSla.createdAt}
                  priority={task.issueSla.priority}
                  status={task.issueSla.status}
                />
              ) : null}
            </div>

            <h3 className="mt-3 text-base font-semibold text-foreground">
              {task.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {task.subtitle}
            </p>
          </div>
        </div>

        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {dueKey ? <CaretakerI18nLabel labelKey={dueKey} /> : task.dueLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          {task.unitHref ? (
            <CaretakerI18nLabel labelKey="unitProfileAfterOpen" />
          ) : (
            <CaretakerI18nLabel labelKey="noUnitLinked" />
          )}
        </span>

        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          {actionKey ? (
            <CaretakerI18nLabel labelKey={actionKey} />
          ) : (
            task.actionLabel
          )}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </DeferredLink>
  );
}

export function TodayTaskList({ tasks }: { tasks: TodayTask[] }) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow={<CaretakerI18nLabel labelKey="priorityQueue" />}
        title={
          tasks.length > 0 ? (
            <CaretakerI18nLabel labelKey="todayTasks" />
          ) : (
            <CaretakerI18nLabel labelKey="todayNoTasks" />
          )
        }
      />

      <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center">
            <p className="text-sm font-semibold text-foreground">
              <CaretakerI18nLabel labelKey="caughtUp" />
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <CaretakerI18nLabel labelKey="caughtUpHint" />
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <DeferredLink
                href="/dashboard/caretaker/units"
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/30"
              >
                <CaretakerI18nLabel labelKey="browseUnits" />
              </DeferredLink>
              <DeferredLink
                href="/dashboard/caretaker"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <CaretakerI18nLabel labelKey="backToDashboard" />
              </DeferredLink>
            </div>
          </div>
        ) : (
          tasks.map((task) => <TodayTaskCard key={task.id} task={task} />)
        )}
      </div>
    </section>
  );
}