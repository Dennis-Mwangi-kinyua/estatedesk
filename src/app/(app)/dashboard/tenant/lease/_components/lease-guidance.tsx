import Link from "next/link";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { TENANT_LEASE_GUIDANCE } from "../_lib/constants";
import { panelShellClassName } from "./leases-ui";

export function LeaseGuidance() {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Common tenant tasks related to your lease, payments, and records.
        </p>

        <div className="mt-4 space-y-3">
          {TENANT_LEASE_GUIDANCE.map((item) => (
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
        <h2 className="text-sm font-semibold text-foreground">Lease guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how rent periods, balances, and contract downloads work in your
          tenant workspace.
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
    </aside>
  );
}