import Link from "next/link";
import type { OrgIssue } from "../_lib/types";
import {
  buildIssuesHref,
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
  getStatusClasses,
} from "../_lib/helpers";

export function IssuesStageBoard({
  issues,
  selectedIssueId,
  currentPage,
}: {
  issues: OrgIssue[];
  selectedIssueId?: string;
  currentPage: number;
}) {
  const columns = [
    {
      key: "new",
      title: "New",
      subtitle: "Open and unassigned",
      issues: issues.filter(
        (issue) => issue.status === "OPEN" && !issue.assignedTo,
      ),
    },
    {
      key: "progress",
      title: "In Progress",
      subtitle: "Assigned and active",
      issues: issues.filter((issue) => issue.status === "IN_PROGRESS"),
    },
    {
      key: "resolved",
      title: "Resolved",
      subtitle: "Finished tickets",
      issues: issues.filter(
        (issue) => issue.status === "RESOLVED" || issue.status === "CLOSED",
      ),
    },
    {
      key: "cancelled",
      title: "Cancelled",
      subtitle: "Stopped tickets",
      issues: issues.filter((issue) => issue.status === "CANCELLED"),
    },
  ] as const;

  return (
    <section className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-1 xl:grid xl:grid-cols-4 xl:overflow-visible">
      {columns.map((column) => (
        <div
          key={column.key}
          className="w-[84vw] max-w-sm shrink-0 snap-center rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] xl:w-auto xl:max-w-none"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">
                {column.title}
              </h3>
              <p className="mt-1 text-xs text-neutral-500">{column.subtitle}</p>
            </div>
            <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-neutral-900 px-2 py-1 text-xs font-semibold text-white">
              {column.issues.length}
            </span>
          </div>

          <div className="space-y-3">
            {column.issues.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-neutral-200 bg-[#fafafa] px-4 py-5 text-sm text-neutral-500">
                No issues here.
              </div>
            ) : (
              column.issues.slice(0, 8).map((issue) => {
                const selected = selectedIssueId === issue.id;

                return (
                  <Link
                    key={issue.id}
                    href={buildIssuesHref(currentPage, issue.id)}
                    className={[
                      "block rounded-[22px] border p-4 transition",
                      selected
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-black/5 bg-[#fafafa] hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClasses(
                          issue.status,
                        )}`}
                      >
                        {issue.status.replaceAll("_", " ")}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getPriorityClasses(
                          issue.priority,
                        )}`}
                      >
                        {issue.priority}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-neutral-950">
                      {issue.title}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {getIssueUnitLabel(issue)}
                    </p>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-600">
                      {issue.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-neutral-500">
                      <span>
                        {issue.assignedTo?.fullName ??
                          issue.assignedTo?.email ??
                          "Unassigned"}
                      </span>
                      <span>{formatDate(issue.createdAt)}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      ))}
    </section>
  );
}