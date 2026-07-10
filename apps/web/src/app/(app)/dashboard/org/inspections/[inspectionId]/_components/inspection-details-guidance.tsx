import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { panelShellClassName } from "@/app/(app)/dashboard/org/properties/_components/properties-ui";

const INSPECTION_GUIDANCE = [
  {
    title: "View tenant record",
    description:
      "Review lease history, payments, and move-out notices linked to this inspection.",
    href: "/dashboard/org/tenants",
    actionLabel: "Open tenants desk",
  },
  {
    title: "Review leases",
    description:
      "Confirm lease status, end dates, and deposit handling after inspection.",
    href: "/dashboard/org/leases",
    actionLabel: "View leases",
  },
  {
    title: "Track issues",
    description:
      "Log maintenance or damage follow-ups discovered during the inspection.",
    href: "/dashboard/org/issues",
    actionLabel: "Open issues desk",
  },
] as const;

export function InspectionDetailsGuidance({
  orgRole,
}: {
  orgRole?: OrgRole | null;
}) {
  return (
    <WorkspaceGuidePanel
      title="After inspection"
      description="Move-out inspections close the tenancy loop. Use these desks to align deposit decisions, repairs, and handover records."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">After inspection</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Move-out inspections close the tenancy loop. Use these desks to align
          deposit decisions, repairs, and handover records.
        </p>

        <div className="mt-4 space-y-3">
          {INSPECTION_GUIDANCE.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-3 inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
              >
                {item.actionLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Move-out workflow</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how notices, inspections, and deposit handling stay connected.
        </p>
        <div className="mt-4">
          <InAppGuideLink
            topic="moveOut"
            workspace="org"
            orgRole={orgRole}
            variant="card"
            className="w-full justify-center"
          />
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}