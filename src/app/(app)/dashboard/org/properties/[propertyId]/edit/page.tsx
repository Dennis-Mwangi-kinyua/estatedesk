import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type EditPropertyPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

const propertyTypes = Object.values(PropertyType);

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const { propertyId } = await params;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      name: true,
      type: true,
      location: true,
      address: true,
      notes: true,
      waterRatePerUnit: true,
      waterFixedCharge: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          units: true,
          buildings: true,
          issues: true,
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
              Property Management
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Edit Property
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Update the property profile, billing defaults, visibility, and
              operational notes.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Units</p>
              <p className="mt-1 text-2xl font-bold">{property._count.units}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Buildings</p>
              <p className="mt-1 text-2xl font-bold">
                {property._count.buildings}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Issues</p>
              <p className="mt-1 text-2xl font-bold">
                {property._count.issues}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Property Information</h2>
            <p className="mt-1 text-sm text-gray-500">
              Edit the core details used across listings, unit assignment, and
              billing.
            </p>
          </div>

          <form className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Property Name
                </label>
                <input
                  id="name"
                  name="name"
                  defaultValue={property.name}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter property name"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="type"
                  className="text-sm font-medium text-gray-700"
                >
                  Property Type
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={property.type}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="location"
                  className="text-sm font-medium text-gray-700"
                >
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  defaultValue={property.location ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Estate, area, town"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="address"
                  className="text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  defaultValue={property.address ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Street or postal address"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="waterRatePerUnit"
                  className="text-sm font-medium text-gray-700"
                >
                  Water Rate Per Unit
                </label>
                <input
                  id="waterRatePerUnit"
                  name="waterRatePerUnit"
                  type="number"
                  step="0.01"
                  defaultValue={property.waterRatePerUnit?.toString() ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="waterFixedCharge"
                  className="text-sm font-medium text-gray-700"
                >
                  Water Fixed Charge
                </label>
                <input
                  id="waterFixedCharge"
                  name="waterFixedCharge"
                  type="number"
                  step="0.01"
                  defaultValue={property.waterFixedCharge?.toString() ?? ""}
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
                rows={6}
                defaultValue={property.notes ?? ""}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                placeholder="Add management notes, operational context, or internal remarks"
              />
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={property.isActive}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800">
                    Property is active
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    Inactive properties can be hidden from daily operational
                    workflows while keeping data intact.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Save Changes
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
            <h3 className="text-lg font-semibold">Property Summary</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-gray-500">Current Status</p>
                <p className="mt-1 text-lg font-semibold">
                  {property.isActive ? "ACTIVE" : "INACTIVE"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-gray-500">Property Type</p>
                <p className="mt-1 text-lg font-semibold">
                  {property.type.replaceAll("_", " ")}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-gray-500">Created</p>
                <p className="mt-1 text-lg font-semibold">
                  {new Intl.DateTimeFormat("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(property.createdAt)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href={`/properties/${property.id}/units/new`}
                className="rounded-xl border px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
              >
                Add a unit
              </Link>
              <Link
                href={`/issues/new?propertyId=${property.id}`}
                className="rounded-xl border px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
              >
                Report an issue
              </Link>
              <Link
                href={`/properties/${property.id}`}
                className="rounded-xl border px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
              >
                View property details
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}