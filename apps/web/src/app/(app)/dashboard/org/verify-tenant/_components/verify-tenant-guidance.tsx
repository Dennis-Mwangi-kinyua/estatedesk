import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { panelShellClassName } from "../../tenants/_components/tenants-ui";

const VERIFY_TENANT_GUIDANCE = [
  {
    title: "Create tenant",
    description:
      "Onboard a verified tenant and assign them to a vacant unit with lease terms.",
    href: "/dashboard/org/tenants/new",
    actionLabel: "Add tenant",
  },
  {
    title: "Tenant directory",
    description:
      "Review existing tenant records, active leases, and contact details.",
    href: "/dashboard/org/tenants",
    actionLabel: "View tenants",
  },
] as const;

export function VerifyTenantGuidance({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <WorkspaceGuidePanel
      title="Before onboarding"
      description="Search across organisations, review lease and payment history, then onboard from the tenant desk."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Before onboarding</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Search across organisations, review lease and payment history, then
          onboard from the tenant desk.
        </p>

        <div className="mt-4 space-y-3">
          {VERIFY_TENANT_GUIDANCE.map((item) => (
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
        <h2 className="text-sm font-semibold text-foreground">Rental operations guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how tenant verification, onboarding, and leases stay connected.
        </p>
        <div className="mt-4">
          <InAppGuideLink
            topic="portfolio"
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