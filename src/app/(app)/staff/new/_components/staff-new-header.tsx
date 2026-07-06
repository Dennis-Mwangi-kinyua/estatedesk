import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { STAFF_SETUP_WORKFLOW } from "../_lib/constants";

type StaffNewHeaderProps = {
  assignmentTargetCount: number;
};

export function StaffNewHeader({ assignmentTargetCount }: StaffNewHeaderProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5" />
              Staff setup
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Add new staff
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Choose the role and caretaker assignment first, then capture profile
              details and login credentials. Caretakers use a guided four-step flow.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/staff"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to staff directory
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Setup steps
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">3</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Profile fields
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">7</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Mapping targets
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {assignmentTargetCount}
          </p>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {STAFF_SETUP_WORKFLOW.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-border bg-muted/15 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {item.step}
              </span>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}