import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default async function BuildingsPage() {
  const buildings = await prisma.building.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
        },
      },
      units: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          houseNo: true,
          status: true,
          isActive: true,
        },
      },
      caretakerAssignments: {
        where: {
          active: true,
        },
        include: {
          caretaker: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const totalBuildings = buildings.length;
  const totalUnits = buildings.reduce((sum, building) => sum + building.units.length, 0);
  const occupiedUnits = buildings.reduce(
    (sum, building) =>
      sum + building.units.filter((unit) => unit.status === "OCCUPIED").length,
    0
  );
  const vacantUnits = buildings.reduce(
    (sum, building) =>
      sum + building.units.filter((unit) => unit.status === "VACANT").length,
    0
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Buildings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage all buildings across your properties.
          </p>
        </div>

        <Link
          href="/properties"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View Properties
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Buildings</p>
          <p className="mt-2 text-2xl font-semibold">{totalBuildings}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Units</p>
          <p className="mt-2 text-2xl font-semibold">{totalUnits}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Occupied Units</p>
          <p className="mt-2 text-2xl font-semibold">{occupiedUnits}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Vacant Units</p>
          <p className="mt-2 text-2xl font-semibold">{vacantUnits}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Buildings</h2>
        </div>

        {buildings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No buildings found.
          </div>
        ) : (
          <div className="divide-y">
            {buildings.map((building) => {
              const occupied = building.units.filter(
                (unit) => unit.status === "OCCUPIED"
              ).length;

              const vacant = building.units.filter(
                (unit) => unit.status === "VACANT"
              ).length;

              const activeUnits = building.units.filter((unit) => unit.isActive).length;

              const primaryCaretaker =
                building.caretakerAssignments.find((assignment) => assignment.isPrimary) ||
                building.caretakerAssignments[0];

              return (
                <div key={building.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{building.name}</h3>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            building.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {building.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Property:{" "}
                        <Link
                          href={`/properties/${building.property.id}`}
                          className="font-medium text-foreground underline underline-offset-4"
                        >
                          {building.property.name}
                        </Link>
                      </p>

                      {(building.property.location || building.property.address) && (
                        <p className="text-sm text-muted-foreground">
                          {[building.property.location, building.property.address]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}

                      {building.notes && (
                        <p className="max-w-2xl text-sm text-muted-foreground">
                          {building.notes}
                        </p>
                      )}
                    </div>

                    <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[420px] lg:max-w-[520px]">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Units</p>
                        <p className="mt-1 text-lg font-semibold">{building.units.length}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {activeUnits} active
                        </p>
                      </div>

                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Occupancy</p>
                        <p className="mt-1 text-lg font-semibold">
                          {occupied} occupied / {vacant} vacant
                        </p>
                      </div>

                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Caretaker</p>
                        <p className="mt-1 text-sm font-medium">
                          {primaryCaretaker?.caretaker.fullName ?? "Not assigned"}
                        </p>
                        {primaryCaretaker?.caretaker.phone && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {primaryCaretaker.caretaker.phone}
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="mt-1 text-sm font-medium">
                          {formatDate(building.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h4 className="mb-3 text-sm font-medium">Units Preview</h4>

                    {building.units.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No units added to this building yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {building.units.slice(0, 12).map((unit) => (
                          <span
                            key={unit.id}
                            className="inline-flex items-center rounded-full border px-3 py-1 text-xs"
                          >
                            {unit.houseNo} • {unit.status}
                          </span>
                        ))}

                        {building.units.length > 12 && (
                          <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
                            +{building.units.length - 12} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}