import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { IMPORT_GUIDANCE } from "../_lib/constants";
import { panelShellClassName } from "./imports-ui";

export function ImportsGuidance({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">After importing</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          CSV imports create portfolio records in one transaction. Use these desks to
          verify structure before billing and collections begin.
        </p>

        <div className="mt-4 space-y-3">
          {IMPORT_GUIDANCE.map((item) => (
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
        <h2 className="text-sm font-semibold text-foreground">Kenya rental operations</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how properties, units, tenants, and collections stay connected.
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