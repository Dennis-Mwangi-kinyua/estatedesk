import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { CHARGES_GUIDANCE } from "../_lib/constants";
import { panelShellClassName } from "./charges-ui";

export function ChargesGuidance({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <WorkspaceGuidePanel
      title="How charges appear"
      description="Rent charges are tied to active leases. Once leases are live and billing periods are issued, charges show up here automatically."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">How charges appear</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Rent charges are tied to active leases. Once leases are live and billing
          periods are issued, charges show up here automatically.
        </p>

        <div className="mt-4 space-y-3">
          {CHARGES_GUIDANCE.map((item) => (
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
        <h2 className="text-sm font-semibold text-foreground">Rent tracking guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how rent periods, allocations, and collection reports stay aligned.
        </p>
        <div className="mt-4">
          <InAppGuideLink
            topic="rent"
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