import Link from "next/link";
import { TicketPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NewIssuePageProps = {
  searchParams: Promise<{
    propertyId?: string;
    unitId?: string;
  }>;
};

const priorities = Object.values(TicketPriority);

export default async function NewIssuePage({
  searchParams,
}: NewIssuePageProps) {
  const { propertyId, unitId } = await searchParams;

  const properties = await prisma.property.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      units: {
        orderBy: {
          houseNo: "asc",
        },
        select: {
          id: true,
          houseNo: true,
        },
      },
    },
  });

  const selectedProperty =
    properties.find((property) => property.id === propertyId) ?? null;

  const unitsForSelectedProperty = selectedProperty?.units ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Link
              href={propertyId ? `/properties/${propertyId}` : "/issues"}
              className="text-sm font-medium text-gray-500 transition hover:text-black"
            >
              ← Back
            </Link>

            <p className="mt-4 text-sm font-medium text-gray-500">
              Maintenance
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Report New Issue
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Log a maintenance or operations ticket and assign the relevant
              property context for follow-up.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Active Properties</p>
              <p className="mt-1 text-2xl font-bold">{properties.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Selected Units</p>
              <p className="mt-1 text-2xl font-bold">
                {unitsForSelectedProperty.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Issue Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Capture the issue accurately so the operations team can respond
              faster.
            </p>
          </div>

          <form className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="propertyId"
                  className="text-sm font-medium text-gray-700"
                >
                  Property
                </label>
                <select
                  id="propertyId"
                  name="propertyId"
                  defaultValue={propertyId ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="">Select property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="unitId"
                  className="text-sm font-medium text-gray-700"
                >
                  Unit
                </label>
                <select
                  id="unitId"
                  name="unitId"
                  defaultValue={unitId ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="">No specific unit</option>
                  {unitsForSelectedProperty.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      Unit {unit.houseNo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-gray-700"
                >
                  Issue Title
                </label>
                <input
                  id="title"
                  name="title"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="e.g. Water leak in corridor, faulty meter, broken gate"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="priority"
                  className="text-sm font-medium text-gray-700"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue={TicketPriority.MEDIUM}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="photo"
                  className="text-sm font-medium text-gray-700"
                >
                  Photo
                </label>
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={7}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black"
                placeholder="Describe the problem, when it started, what has been affected, and any urgent context"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Create Issue
              </button>

              <Link
                href={propertyId ? `/properties/${propertyId}` : "/issues"}
                className="inline-flex items-center rounded-xl border px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Selected Context</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-gray-500">Property</p>
                <p className="mt-1 text-lg font-semibold">
                  {selectedProperty?.name ?? "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-gray-500">Unit</p>
                <p className="mt-1 text-lg font-semibold">
                  {unitsForSelectedProperty.find((unit) => unit.id === unitId)
                    ?.houseNo ?? "Not selected"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Reporting Tips</h3>
            <div className="mt-5 space-y-3 text-sm text-gray-600">
              <p>Use clear titles so tickets are easy to scan.</p>
              <p>Attach a photo when the issue is visual or safety-related.</p>
              <p>Choose the right property and unit for faster assignment.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}