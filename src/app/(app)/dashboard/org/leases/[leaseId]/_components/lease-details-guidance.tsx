import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { panelShellClassName } from "../../_components/leases-ui";

const LEASE_DETAILS_GUIDANCE = [
  {
    title: "Review rent charges",
    description:
      "Track billing periods and outstanding balances linked to active leases.",
    href: "/dashboard/org/charges",
    actionLabel: "View charges",
  },
  {
    title: "Open payments desk",
    description:
      "Verify tenant payments and review monthly collections against leases.",
    href: "/dashboard/org/payments",
    actionLabel: "Open payments",
  },
] as const;

export function LeaseDetailsGuidance({
  orgRole,
  tenantId,
}: {
  orgRole?: OrgRole | null;
  tenantId: string;
}) {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Related desks</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Charges, payments, and tenant records stay connected through the active
          lease.
        </p>

        <div className="mt-4 space-y-3">
          {LEASE_DETAILS_GUIDANCE.map((item) => (
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

          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <p className="text-sm font-semibold text-foreground">View tenant profile</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Open the linked tenant record for contact details and lease history.
            </p>
            <Link
              href={`/dashboard/org/tenants/${tenantId}`}
              className="mt-3 inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
            >
              Open tenant
            </Link>
          </div>
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Lease management guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how tenancy records, billing periods, and collections stay aligned.
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
    </aside>
  );
}