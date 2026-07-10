import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, Wrench } from "lucide-react";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

export {
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

export function FilterStatCard({
  title,
  value,
  note,
  href,
  isActive = false,
  highlight,
  icon: Icon,
}: {
  title: ReactNode;
  value: string | number;
  note: ReactNode;
  href: string;
  isActive?: boolean;
  highlight?: "default" | "warning" | "success";
  icon: ComponentType<{ className?: string }>;
}) {
  const valueClassName =
    highlight === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : highlight === "success"
        ? "text-emerald-700 dark:text-emerald-200"
        : "text-foreground";

  return (
    <Link
      href={href}
      className={[
        "group block rounded-2xl border px-4 py-4 transition sm:px-5 sm:py-5",
        isActive
          ? "border-primary/40 bg-primary/5 ring-2 ring-primary/15"
          : "border-border bg-muted/10 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/20 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
            {title}
          </p>
          <p className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${valueClassName}`}>
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{note}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-foreground">
            Track issues
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>

        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition",
            isActive
              ? "border-primary/30 bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground group-hover:border-primary/25 group-hover:bg-primary group-hover:text-primary-foreground",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

export function EmptyStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background">
        <Wrench className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      <div className="mt-4">
        <InAppGuideLink topic="caretaker" workspace="caretaker" />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Link
          href="/dashboard/caretaker/issues/new"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Create new issue
        </Link>

        <Link
          href="/dashboard/caretaker/issues"
          className="inline-flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/30"
        >
          View all issues
        </Link>
      </div>
    </div>
  );
}

export function WorkflowStep({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {step}
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}