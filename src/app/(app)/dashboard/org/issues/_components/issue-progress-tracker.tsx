import type { OrgIssue } from "../_lib/types";

export function IssueProgressTracker({ issue }: { issue: OrgIssue }) {
  const steps = [
    {
      label: "Reported",
      active: true,
      caption: "Issue submitted",
    },
    {
      label: "Assigned",
      active: Boolean(issue.assignedTo),
      caption: issue.assignedTo
        ? `Allocated to ${issue.assignedTo.fullName ?? issue.assignedTo.email ?? "caretaker"}`
        : "Awaiting allocation",
    },
    {
      label: "Progress",
      active:
        issue.status === "IN_PROGRESS" ||
        issue.status === "RESOLVED" ||
        issue.status === "CLOSED",
      caption:
        issue.status === "IN_PROGRESS" ||
        issue.status === "RESOLVED" ||
        issue.status === "CLOSED"
          ? "Work underway"
          : "Not started",
    },
    {
      label: "Resolved",
      active: issue.status === "RESOLVED" || issue.status === "CLOSED",
      caption:
        issue.status === "RESOLVED" || issue.status === "CLOSED"
          ? "Completed"
          : "Pending",
    },
  ];

  return (
    <div className="mt-5 rounded-[24px] bg-[#f7f7fa] p-4">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
          Progress tracking
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          Ticket stage from report to resolution.
        </p>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className="min-w-[180px] rounded-[22px] bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                  step.active
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-200 text-neutral-600",
                ].join(" ")}
              >
                {index + 1}
              </div>
              <p className="text-sm font-semibold text-neutral-950">
                {step.label}
              </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              {step.caption}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}