import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { TAXES_GUIDANCE } from "../_lib/constants";
import { panelShellClassName } from "./taxes-ui";

export function TaxesGuidance({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">After tax setup</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Rental income tax stays accurate when billing, collections, and property
          records stay aligned.
        </p>

        <div className="mt-4 space-y-3">
          {TAXES_GUIDANCE.map((item) => (
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
        <h2 className="text-sm font-semibold text-foreground">Tax compliance guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how rental income, MRI returns, and remittance workflows stay connected.
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