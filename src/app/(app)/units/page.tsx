import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatCurrency(value: unknown) {
  const amount =
    typeof value === "object" && value !== null && "toNumber" in value
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function UnitsPage() {
  const units = await prisma.unit.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
        },
      },
      building: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const totalUnits = units.length;
  const occupiedUnits = units.filter((unit) => unit.status === "OCCUPIED").length;
  const vacantUnits = units.filter((unit) => unit.status === "VACANT").length;
  const activeUnits = units.filter((unit) => unit.isActive).length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Units</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage all units across properties and buildings.
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
          <p className="text-sm text-muted-foreground">Total Units</p>
          <p className="mt-2 text-2xl font-semibold">{totalUnits}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Units</p>
          <p className="mt-2 text-2xl font-semibold">{activeUnits}</p>
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
          <h2 className="text-base font-semibold">All Units</h2>
        </div>

        {units.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No units found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">House No</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Bedrooms</th>
                  <th className="px-4 py-3 font-medium">Bathrooms</th>
                  <th className="px-4 py-3 font-medium">Rent</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{unit.houseNo}</td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/properties/${unit.property.id}`}
                        className="underline underline-offset-4"
                      >
                        {unit.property.name}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      {unit.building ? unit.building.name : "—"}
                    </td>

                    <td className="px-4 py-3">{unit.type}</td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                        {unit.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">{unit.bedrooms ?? "—"}</td>
                    <td className="px-4 py-3">{unit.bathrooms ?? "—"}</td>
                    <td className="px-4 py-3">{formatCurrency(unit.rentAmount)}</td>
                    <td className="px-4 py-3">{unit.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}