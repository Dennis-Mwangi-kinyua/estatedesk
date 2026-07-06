import { DeferredLink } from "@/components/navigation/app-links";
import type { PropertiesPageData } from "../_lib/types";
import { formatDate, formatMoney, formatPropertyType } from "../_lib/helpers";
import { InfoPanel, PropertyStatusPill } from "./properties-ui";

export function PropertiesItemsSection({ data }: { data: PropertiesPageData }) {
  const { membership, properties } = data;

  return (
    <div className="divide-y divide-border">
      {properties.map((property) => (
        <article key={property.id} className="px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:grid xl:grid-cols-12 xl:gap-6">
            <div className="xl:col-span-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DeferredLink
                    href={`/dashboard/org/properties/${property.id}`}
                    className="truncate text-lg font-semibold text-foreground transition hover:text-primary"
                  >
                    {property.name}
                  </DeferredLink>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPropertyType(property.type)}
                  </p>
                </div>

                <PropertyStatusPill active={property.isActive} />
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Location:</span>{" "}
                  {property.location || "—"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Address:</span>{" "}
                  {property.address || "—"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Created:</span>{" "}
                  {formatDate(property.createdAt)}
                </p>
              </div>

              {property.notes ? (
                <InfoPanel label="Notes">
                  <p className="text-sm leading-6 text-muted-foreground">{property.notes}</p>
                </InfoPanel>
              ) : null}
            </div>

            <div className="xl:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Taxpayer profile
              </p>

              {property.taxpayerProfile ? (
                <InfoPanel label={property.taxpayerProfile.displayName}>
                  <p className="text-sm text-muted-foreground">
                    PIN: {property.taxpayerProfile.kraPin}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {property.taxpayerProfile.kind}
                  </p>
                </InfoPanel>
              ) : (
                <div className="mt-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No taxpayer profile linked
                </div>
              )}
            </div>

            <div className="xl:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Water billing defaults
              </p>

              <InfoPanel label="Rates">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Rate per unit</p>
                    <p className="font-medium text-foreground">
                      {formatMoney(
                        property.waterRatePerUnit?.toString(),
                        membership.org.currencyCode,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fixed charge</p>
                    <p className="font-medium text-foreground">
                      {formatMoney(
                        property.waterFixedCharge?.toString(),
                        membership.org.currencyCode,
                      )}
                    </p>
                  </div>
                </div>
              </InfoPanel>
            </div>

            <div className="xl:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Portfolio stats
              </p>

              <div className="mt-2 grid grid-cols-3 gap-3 xl:grid-cols-1">
                <InfoPanel label="Buildings">
                  <p className="text-xl font-semibold text-foreground">
                    {property._count.buildings}
                  </p>
                </InfoPanel>
                <InfoPanel label="Units">
                  <p className="text-xl font-semibold text-foreground">
                    {property._count.units}
                  </p>
                </InfoPanel>
                <InfoPanel label="Issues">
                  <p className="text-xl font-semibold text-foreground">
                    {property._count.issues}
                  </p>
                </InfoPanel>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}