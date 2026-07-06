import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { ROLE_META } from "@/features/staff/constants/role-meta";
import { ROLE_DIRECTORY_WORKFLOW } from "../_lib/constants";
import type { RoleMembersDirectoryData } from "../_lib/queries";
import { StatCard } from "@/app/(app)/staff/_components/staff-ui";

type RoleMembersHeaderProps = {
  data: Pick<
    RoleMembersDirectoryData,
    | "role"
    | "totalMembers"
    | "onlineMembers"
    | "activeAccounts"
    | "mappedCaretakers"
    | "totalAssignments"
  >;
};

export function RoleMembersHeader({ data }: RoleMembersHeaderProps) {
  const {
    role,
    totalMembers,
    onlineMembers,
    activeAccounts,
    mappedCaretakers,
    totalAssignments,
  } = data;
  const meta = ROLE_META[role];
  const roleSlug = role.toLowerCase();

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span
                aria-hidden="true"
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${meta.badgeClass} dark:border-border dark:bg-muted/20 dark:text-foreground`}
              >
                {meta.shortLabel}
              </span>
              Organisation role
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {meta.label} directory
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {meta.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/staff"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to directories
            </Link>
            <Link
              href={`/staff/${roleSlug}/new`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" />
              Add {meta.label}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        <StatCard label="Total members" value={totalMembers} />
        <StatCard label="Online now" value={onlineMembers} highlight="success" />
        {role === "CARETAKER" ? (
          <StatCard label="Active assignments" value={totalAssignments} />
        ) : (
          <StatCard label="Active accounts" value={activeAccounts} />
        )}
      </div>

      {role === "CARETAKER" ? (
        <div className="flex flex-wrap gap-2 border-b border-border px-5 py-4 sm:px-6">
          <span className="inline-flex rounded-full border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Mapped caretakers: {mappedCaretakers}
          </span>
          <span className="inline-flex rounded-full border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Unmapped: {Math.max(totalMembers - mappedCaretakers, 0)}
          </span>
        </div>
      ) : null}

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {ROLE_DIRECTORY_WORKFLOW.map((item) => (
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