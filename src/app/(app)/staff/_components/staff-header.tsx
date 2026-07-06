import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, UserPlus, Users } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { ROLE_META, STAFF_ROLES } from "@/features/staff/constants/role-meta";
import { STAFF_DIRECTORY_WORKFLOW } from "../_lib/constants";
import type { getStaffDirectoryData } from "../_lib/queries";
import { StatCard } from "./staff-ui";

type StaffHeaderProps = {
  data: Pick<
    Awaited<ReturnType<typeof getStaffDirectoryData>>,
    "totalStaff" | "onlineStaffUsers" | "roleCounts"
  >;
  orgRole?: OrgRole | null;
};

export function StaffHeader({ data, orgRole }: StaffHeaderProps) {
  const { totalStaff, onlineStaffUsers, roleCounts } = data;
  const offlineStaff = Math.max(totalStaff - onlineStaffUsers, 0);

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Organisation people
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Staff directory
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              View every staff member, their role, online status, and most recent activity
              from one place.
            </p>

            <InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <Link
              href="/staff/previous"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              Previous employees
            </Link>
            <Link
              href="/staff/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" />
              Add new staff
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        <StatCard label="Total staff" value={totalStaff} />
        <StatCard label="Online now" value={onlineStaffUsers} highlight="success" />
        <StatCard label="Offline" value={offlineStaff} />
      </div>

      <div className="flex flex-wrap gap-2 px-5 py-4 sm:px-6">
        {STAFF_ROLES.map((role) => (
          <span
            key={role}
            className="inline-flex rounded-full border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            {ROLE_META[role].label}: {roleCounts[role]}
          </span>
        ))}
      </div>

      <div className="grid gap-3 border-t border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        {STAFF_DIRECTORY_WORKFLOW.map((item) => (
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