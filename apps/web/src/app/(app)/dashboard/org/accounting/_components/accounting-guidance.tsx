import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { ACCOUNTING_GUIDANCE } from "../_lib/constants";
import { panelShellClassName } from "./accounting-ui";

export function AccountingGuidance({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <WorkspaceGuidePanel
      title="Connected workflows"
      description="Accounting stays aligned when expenditures, payments, and rent charges feed the same ledger."
      className="lg:sticky lg:top-4 lg:self-start"
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Connected workflows</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Accounting stays aligned when expenditures, payments, and rent charges feed
          the same ledger.
        </p>
        <div className="mt-3 space-y-2">
          {ACCOUNTING_GUIDANCE.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="block rounded-2xl border border-border bg-muted/10 px-3 py-3 transition hover:bg-muted/20"
            >
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-2 text-xs font-semibold text-primary">{item.actionLabel}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Rent tracking guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          See how collections, balances, and finance reporting stay connected.
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