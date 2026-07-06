import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { EXPENDITURE_GUIDANCE } from "../_lib/constants";
import { panelShellClassName } from "./expenditures-ui";

export function ExpendituresGuidance({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Cost scopes</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Organization costs stay at portfolio level. Tenant-linked costs help you
          track recoverable repairs and services.
        </p>

        <div className="mt-4 space-y-3">
          {EXPENDITURE_GUIDANCE.map((item) => (
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
        <h2 className="text-sm font-semibold text-foreground">Operations guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          See how rent, billing, and portfolio operations stay aligned across your
          organization.
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
    </aside>
  );
}