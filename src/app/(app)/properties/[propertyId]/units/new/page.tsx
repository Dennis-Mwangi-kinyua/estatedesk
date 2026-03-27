import Link from "next/link";
import { notFound } from "next/navigation";
import { UnitStatus, UnitType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NewUnitPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

const unitTypes = Object.values(UnitType);
const unitStatuses = Object.values(UnitStatus);

export default async function NewUnitPage({ params }: NewUnitPageProps) {
  const { propertyId } = await params;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      name: true,
      type: true,
      buildings: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          units: true,
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Link
              href={`/properties/${property.id}`}
              className="text-sm font-medium text-gray-500 transition hover:text-black"
            >
              ← Back to property details
            </Link>

            <p className="mt-4 text-sm font-medium text-gray-500">
              Unit Management
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Add New Unit
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Create a new rentable unit under{" "}
              <span className="font-medium text-gray-800">{property.name}</span>
              .
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Current Units</p>
              <p className="mt-1 text-2xl font-bold">{property._count.units}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Buildings</p>
              <p className="mt-1 text-2xl font-bold">
                {property.buildings.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Unit Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure the unit profile, pricing, and status.
            </p>
          </div>

          <form className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="houseNo"
                  className="text-sm font-medium text-gray-700"
                >
                  Unit / House Number
                </label>
                <input
                  id="houseNo"
                  name="houseNo"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="e.g. A1, B12, Shop 3"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="buildingId"
                  className="text-sm font-medium text-gray-700"
                >
                  Building
                </label>
                <select
                  id="buildingId"
                  name="buildingId"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
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
                  className="text-sm font-medium text-gray-700"
                >
                  Unit Type
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={UnitType.APARTMENT}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
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
                  className="text-sm font-medium text-gray-700"
                >
                  Initial Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={UnitStatus.VACANT}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
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
                  className="text-sm font-medium text-gray-700"
                >
                  Bedrooms
                </label>
                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="bathrooms"
                  className="text-sm font-medium text-gray-700"
                >
                  Bathrooms
                </label>
                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="floorArea"
                  className="text-sm font-medium text-gray-700"
                >
                  Floor Area
                </label>
                <input
                  id="floorArea"
                  name="floorArea"
                  type="number"
                  step="0.01"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="vacantSince"
                  className="text-sm font-medium text-gray-700"
                >
                  Vacant Since
                </label>
                <input
                  id="vacantSince"
                  name="vacantSince"
                  type="date"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="rentAmount"
                  className="text-sm font-medium text-gray-700"
                >
                  Monthly Rent
                </label>
                <input
                  id="rentAmount"
                  name="rentAmount"
                  type="number"
                  step="0.01"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="depositAmount"
                  className="text-sm font-medium text-gray-700"
                >
                  Deposit Amount
                </label>
                <input
                  id="depositAmount"
                  name="depositAmount"
                  type="number"
                  step="0.01"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="notes"
                className="text-sm font-medium text-gray-700"
              >
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                placeholder="Add internal notes about access, setup, repairs, or unit specifics"
              />
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800">
                    Unit is active
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    Active units are available in operational workflows and
                    tenant assignment.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Create Unit
              </button>

              <Link
                href={`/properties/${property.id}`}
                className="inline-flex items-center rounded-xl border px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Property Context</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-gray-500">Property Name</p>
                <p className="mt-1 text-lg font-semibold">{property.name}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-gray-500">Property Type</p>
                <p className="mt-1 text-lg font-semibold">
                  {property.type.replaceAll("_", " ")}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-gray-500">Building Options</p>
                <p className="mt-1 text-lg font-semibold">
                  {property.buildings.length}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Tips</h3>
            <div className="mt-5 space-y-3 text-sm text-gray-600">
              <p>Use a consistent naming format for unit numbers.</p>
              <p>Set the initial status correctly for accurate occupancy.</p>
              <p>Include deposit and rent values to simplify lease setup.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}