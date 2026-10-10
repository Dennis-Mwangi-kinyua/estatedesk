import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, Archive, ChevronDown, UserRoundPlus, UsersRound } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { ROLE_META, STAFF_ROLES } from "@/features/staff/constants/role-meta";
import { STAFF_DIRECTORY_WORKFLOW } from "../_lib/constants";
import type { getStaffDirectoryData } from "../_lib/queries";
import { StaffRoleIcon, StatCard } from "./staff-ui";

type StaffHeaderProps = {
  data: Pick<Awaited<ReturnType<typeof getStaffDirectoryData>>, "totalStaff" | "onlineStaffUsers" | "roleCounts">;
  orgRole?: OrgRole | null;
};

export function StaffHeader({ data, orgRole }: StaffHeaderProps) {
  const { totalStaff, onlineStaffUsers, roleCounts } = data;
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border p-4 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UsersRound aria-hidden="true" className="h-6 w-6" strokeWidth={1.75} /></span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Organisation people</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Staff directory</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Your team, roles, and activity in one place. Open a profile to manage staff details and assignments.</p>
            <InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} />
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-56">
            <Link data-workspace-action="true" href="/staff/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:col-span-2">
              <UserRoundPlus aria-hidden="true" className="h-5 w-5 shrink-0" />Add new staff
            </Link>
            <Link data-workspace-action="true" href="/staff/previous" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Archive aria-hidden="true" className="h-4 w-4 shrink-0" />Previous employees
            </Link>
            <Link data-workspace-action="true" href="/dashboard/org" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />Dashboard
            </Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4 sm:gap-3 sm:p-6">
        <StatCard label="Total staff" value={totalStaff} />
        <StatCard label="Online now" value={onlineStaffUsers} highlight="success" />
        <StatCard label="Offline" value={Math.max(totalStaff - onlineStaffUsers, 0)} />
      </div>
      <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-6 sm:pb-6" aria-label="Staff by role">
        {STAFF_ROLES.map(role => <Link key={role} href={`/staff/${role.toLowerCase()}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs font-medium transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <StaffRoleIcon role={role} className="h-4 w-4" />{ROLE_META[role].label}<span className="font-semibold tabular-nums">{roleCounts[role]}</span>
        </Link>)}
      </div>
      <details className="group border-t border-border">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 [&::-webkit-details-marker]:hidden">How staff management works<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition group-open:rotate-180" /></summary>
        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-3 sm:px-6 sm:pb-6">
          {STAFF_DIRECTORY_WORKFLOW.map(item => <div key={item.step} className="rounded-2xl bg-muted/20 p-4"><p className="text-sm font-semibold"><span className="mr-2 text-primary">{item.step}</span>{item.title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></div>)}
        </div>
      </details>
    </section>
  );
}
