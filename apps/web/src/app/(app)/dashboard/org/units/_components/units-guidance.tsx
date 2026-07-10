import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { UNITS_GUIDANCE } from "../_lib/constants";
import type { UnitsPageData } from "../_lib/types";
import { panelShellClassName } from "./units-ui";

export function UnitsGuidance({
  data,
  orgRole,
}: {
  data: UnitsPageData;
  orgRole?: OrgRole | null;
}) {
  const { vacantUnits } = data;

  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Portfolio navigation</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Units sit inside properties and buildings. Use these desks to keep inventory,
          vacancies, and tenant assignments aligned.
        </p>

        <div className="mt-4 space-y-3">
          {UNITS_GUIDANCE.map((item) => (
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

      {vacantUnits > 0 ? (
        <section className={`${panelShellClassName} p-4`}>
          <h2 className="text-sm font-semibold text-foreground">Vacancy marketing</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Learn how to publish vacant units and track inquiry interest.
          </p>
          <div className="mt-4">
            <InAppGuideLink
              topic="vacancies"
              workspace="org"
              orgRole={orgRole}
              variant="card"
              className="w-full justify-center"
            />
          </div>
        </section>
      ) : (
        <section className={`${panelShellClassName} p-4`}>
          <h2 className="text-sm font-semibold text-foreground">Rental operations</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Learn how properties, units, tenants, and leases stay connected.
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
      )}
    </aside>
  );
}