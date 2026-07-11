import Link from "next/link";
import {
  UnitStatus,
  UnitType,
  type OrgRole,
  type PropertyType,
} from "@prisma/client";
import { PropertiesGuidance } from "../../../../_components/properties-guidance";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  InfoPanel,
  panelShellClassName,
  StatCard,
} from "../../../../_components/properties-ui";
import { createUnitAction } from "../actions";

export type UnitCreatePropertyData = {
  id: string;
  name: string;
  type: PropertyType;
  buildings: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    units: number;
  };
};

const unitTypes = Object.values(UnitType);
const unitStatuses = Object.values(UnitStatus);

export function UnitCreateWorkspace({
  property,
  orgRole,
}: {
  property: UnitCreatePropertyData;
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
              Unit Management
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              Add New Unit
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Create a new rentable unit under{" "}
              <span className="font-medium text-foreground">{property.name}</span>.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Current Units" value={property._count.units} />
            <StatCard label="Buildings" value={property.buildings.length} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className={`${panelShellClassName} p-6`}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Unit Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure the unit profile, pricing, and status.
              </p>
            </div>

            <form action={createUnitAction} className="space-y-6">
              <input type="hidden" name="propertyId" value={property.id} />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="houseNo"
                    className="text-sm font-medium text-foreground"
                  >
                    Unit / House Number
                  </label>
                  <input
                    id="houseNo"
                    name="houseNo"
                    required
                    className={fieldClassName}
                    placeholder="e.g. A1, B12, Shop 3"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="buildingId"
                    className="text-sm font-medium text-foreground"
                  >
                    Building
                  </label>
                  <select
                    id="buildingId"
                    name="buildingId"
                    className={fieldClassName}
                    defaultValue=""
                  >
                    <option value="">No building / standalone</option>
                    {property.buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="type"
                    className="text-sm font-medium text-foreground"
                  >
                    Unit Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={UnitType.APARTMENT}
                    className={fieldClassName}
                  >
                    {unitTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="status"
                    className="text-sm font-medium text-foreground"
                  >
                    Initial Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={UnitStatus.VACANT}
                    className={fieldClassName}
                  >
                    {unitStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="bedrooms"
                    className="text-sm font-medium text-foreground"
                  >
                    Bedrooms
                  </label>
                  <input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="0"
                    className={fieldClassName}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="bathrooms"
                    className="text-sm font-medium text-foreground"
                  >
                    Bathrooms
                  </label>
                  <input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    min="0"
                    className={fieldClassName}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="floorArea"
                    className="text-sm font-medium text-foreground"
                  >
                    Floor Area
                  </label>
                  <input
                    id="floorArea"
                    name="floorArea"
                    type="number"
                    step="0.01"
                    className={fieldClassName}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="vacantSince"
                    className="text-sm font-medium text-foreground"
                  >
                    Vacant Since
                  </label>
                  <input
                    id="vacantSince"
                    name="vacantSince"
                    type="date"
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="rentAmount"
                    className="text-sm font-medium text-foreground"
                  >
                    Monthly Rent
                  </label>
                  <input
                    id="rentAmount"
                    name="rentAmount"
                    type="number"
                    step="0.01"
                    className={fieldClassName}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="depositAmount"
                    className="text-sm font-medium text-foreground"
                  >
                    Deposit Amount
                  </label>
                  <input
                    id="depositAmount"
                    name="depositAmount"
                    type="number"
                    step="0.01"
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
                  rows={5}
                  className={`${fieldClassName} min-h-[7.5rem] py-3`}
                  placeholder="Add internal notes about access, setup, repairs, or unit specifics"
                />
              </div>

              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      Unit is active
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Active units are available in operational workflows and
                      tenant assignment.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className={buttonPrimaryClassName}>
                  Create Unit
                </button>

                <Link href={propertyBasePath} className={buttonSecondaryClassName}>
                  Cancel
                </Link>
              </div>
            </form>
          </section>

          <section className={`${panelShellClassName} p-6`}>
            <h3 className="text-lg font-semibold text-foreground">Property Context</h3>
            <div className="mt-5 space-y-4">
              <InfoPanel label="Property Name">
                <p className="text-lg font-semibold text-foreground">{property.name}</p>
              </InfoPanel>

              <InfoPanel label="Property Type">
                <p className="text-lg font-semibold text-foreground">
                  {property.type.replaceAll("_", " ")}
                </p>
              </InfoPanel>

              <InfoPanel label="Building Options">
                <p className="text-lg font-semibold text-foreground">
                  {property.buildings.length}
                </p>
              </InfoPanel>
            </div>
          </section>

          <section className={`${panelShellClassName} p-6`}>
            <h3 className="text-lg font-semibold text-foreground">Tips</h3>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground">
              <p>Use a consistent naming format for unit numbers.</p>
              <p>Set the initial status correctly for accurate occupancy.</p>
              <p>Include deposit and rent values to simplify lease setup.</p>
            </div>
          </section>
        </div>

        <PropertiesGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}