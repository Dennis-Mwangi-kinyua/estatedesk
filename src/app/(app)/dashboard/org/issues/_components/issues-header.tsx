import type { OrgMembershipContext, IssuesStats } from "../_lib/types";
import { SurfaceCard } from "./issues-page-shell";

export function IssuesHeader({
  membership,
  stats,
}: {
  membership: OrgMembershipContext;
  stats: IssuesStats;
}) {
  const newIssuesText =
    stats.newIssues === 0
      ? "No new issues"
      : `${stats.newIssues} new issue${stats.newIssues === 1 ? "" : "s"}`;

  return (
    <SurfaceCard className="overflow-hidden p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-600">
              Organization Operations
            </span>
            <span
              className={[
                "rounded-full px-3 py-1 text-[11px] font-semibold",
                stats.newIssues === 0
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-orange-50 text-orange-700",
              ].join(" ")}
            >
              {newIssuesText}
            </span>
          </div>

          <h1 className="mt-3 text-[30px] font-semibold tracking-tight text-neutral-950 sm:text-[34px]">
            Issues
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Mobile-first issue workflow for {membership.org.name}. Assign a
            caretaker and the issue automatically moves to progress.
          </p>
        </div>

        <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
            Active Organization
          </p>
          <p className="mt-1 text-base font-semibold text-neutral-950">
            {membership.org.name}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Role: {membership.role.replaceAll("_", " ")}
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
}