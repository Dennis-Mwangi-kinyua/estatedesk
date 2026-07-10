import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { TENANT_OVERVIEW_GUIDANCE } from "../_lib/constants";
import { panelShellClassName } from "./tenant-dashboard-ui";

export function TenantDashboardGuidance() {
  return (
    <WorkspaceGuidePanel
      title="Workspace guide"
      description="Common tasks for managing your tenancy, payments, and property requests."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold text-foreground">Workspace guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Common tasks for managing your tenancy, payments, and property requests.
        </p>

        <div className="mt-4 space-y-3">
          {TENANT_OVERVIEW_GUIDANCE.map((item) => (
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

      <section className={`${panelShellClassName} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold text-foreground">Tenant guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how rent, water billing, and maintenance requests work in your
          portal.
        </p>
        <div className="mt-4">
          <InAppGuideLink
            topic="rent"
            workspace="tenant"
            variant="card"
            className="w-full justify-center"
          />
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}