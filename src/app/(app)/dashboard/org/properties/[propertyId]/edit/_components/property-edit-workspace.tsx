import Link from "next/link";
import { PropertyType, type OrgRole } from "@prisma/client";
import { PropertiesGuidance } from "../../../_components/properties-guidance";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  InfoPanel,
  panelShellClassName,
  PropertyStatusPill,
  StatCard,
} from "../../../_components/properties-ui";

export type PropertyEditData = {
  id: string;
  name: string;
  type: PropertyType;
  location: string | null;
  address: string | null;
  notes: string | null;
  waterRatePerUnit: { toString(): string } | null;
  waterFixedCharge: { toString(): string } | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    units: number;
    buildings: number;
    issues: number;
  };
};

const propertyTypes = Object.values(PropertyType);

export function PropertyEditWorkspace({
  property,
  orgRole,
}: {
  property: PropertyEditData;
  orgRole?: OrgRole | null;
}) {
  const propertyBasePath = `/dashboard/org/properties/${property.id}`;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={`${panelShellClassName} p-6`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Link
              href={propertyBasePath}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              ← Back to property details
            </Link>

            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Property Management
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              Edit Property
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Update the property profile, billing defaults, visibility, and
              operational notes.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Units" value={property._count.units} />
            <StatCard label="Buildings" value={property._count.buildings} />
            <StatCard label="Issues" value={property._count.issues} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className={`${panelShellClassName} p-6`}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Property Information
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit the core details used across listings, unit assignment, and
                billing.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-foreground"
                  >
                    Property Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    defaultValue={property.name}
                    className={fieldClassName}
                    placeholder="Enter property name"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="type"
                    className="text-sm font-medium text-foreground"
                  >
                    Property Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={property.type}
                    className={fieldClassName}
                  >
                    {propertyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.replaceAll("_", " ")}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="location"
                    className="text-sm font-medium text-foreground"
                  >
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    defaultValue={property.location ?? ""}
                    className={fieldClassName}
                    placeholder="Estate, area, town"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="address"
                    className="text-sm font-medium text-foreground"
                  >
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    defaultValue={property.address ?? ""}
                    className={fieldClassName}
                    placeholder="Street or postal address"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="waterRatePerUnit"
                    className="text-sm font-medium text-foreground"
                  >
                    Water Rate Per Unit
                  </label>
                  <input
                    id="waterRatePerUnit"
                    name="waterRatePerUnit"
                    type="number"
                    step="0.01"
                    defaultValue={property.waterRatePerUnit?.toString() ?? ""}
                    className={fieldClassName}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="waterFixedCharge"
                    className="text-sm font-medium text-foreground"
                  >
                    Water Fixed Charge
                  </label>
                  <input
                    id="waterFixedCharge"
                    name="waterFixedCharge"
                    type="number"
                    step="0.01"
                    defaultValue={property.waterFixedCharge?.toString() ?? ""}
                    className={fieldClassName}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="notes"
                  className="text-sm font-medium text-foreground"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={6}
                  defaultValue={property.notes ?? ""}
                  className={`${fieldClassName} min-h-[9rem] py-3`}
                  placeholder="Add management notes, operational context, or internal remarks"
                />
              </div>

              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={property.isActive}
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      Property is active
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Inactive properties can be hidden from daily operational
                      workflows while keeping data intact.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className={buttonPrimaryClassName}>
                  Save Changes
                </button>

                <Link href={propertyBasePath} className={buttonSecondaryClassName}>
                  Cancel
                </Link>
              </div>
            </form>
          </section>

          <section className={`${panelShellClassName} p-6`}>
            <h3 className="text-lg font-semibold text-foreground">
              Property Summary
            </h3>
            <div className="mt-5 space-y-4">
              <InfoPanel label="Current Status">
                <PropertyStatusPill active={property.isActive} />
              </InfoPanel>

              <InfoPanel label="Property Type">
                <p className="text-lg font-semibold text-foreground">
                  {property.type.replaceAll("_", " ")}
                </p>
              </InfoPanel>

              <InfoPanel label="Created">
                <p className="text-lg font-semibold text-foreground">
                  {new Intl.DateTimeFormat("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(property.createdAt)}
                </p>
              </InfoPanel>
            </div>
          </section>

          <section className={`${panelShellClassName} p-6`}>
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href={`${propertyBasePath}/units/new`}
                className={buttonSecondaryClassName}
              >
                Add a unit
              </Link>
              <Link
                href={`/dashboard/org/issues/new?propertyId=${property.id}`}
                className={buttonSecondaryClassName}
              >
                Report an issue
              </Link>
              <Link href={propertyBasePath} className={buttonSecondaryClassName}>
                View property details
              </Link>
            </div>
          </section>
        </div>

        <PropertiesGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}