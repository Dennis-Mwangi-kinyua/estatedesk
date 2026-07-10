import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { BUILDINGS_GUIDANCE } from "../_lib/constants";
import { panelShellClassName } from "./buildings-ui";

export function BuildingsGuidance({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Portfolio navigation</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Buildings sit between properties and units. Use these desks to keep structure,
          occupancy, and caretaker coverage aligned.
        </p>

        <div className="mt-4 space-y-3">
          {BUILDINGS_GUIDANCE.map((item) => (
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
        <h2 className="text-sm font-semibold text-foreground">Rental operations</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how properties, buildings, units, and caretakers stay connected.
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