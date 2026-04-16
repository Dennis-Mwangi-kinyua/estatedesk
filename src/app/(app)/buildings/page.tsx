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

type BuildingsPageProps = {
  searchParams?: Promise<{ q?: string }> | { q?: string };
};

export default async function BuildingsPage({ searchParams }: BuildingsPageProps) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<{ q?: string }>).then === "function"
      ? await (searchParams as Promise<{ q?: string }>)
      : (searchParams as { q?: string } | undefined);

  const query = resolvedSearchParams?.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();

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

  const filteredBuildings = query
    ? buildings.filter((building) => {
        const searchableText = [
          building.name,
          building.notes,
          building.property.name,
          building.property.location,
          building.property.address,
          ...building.units.map((unit) => unit.houseNo),
          ...building.caretakerAssignments.map(
            (assignment) => assignment.caretaker.fullName
          ),
          ...building.caretakerAssignments.map(
            (assignment) => assignment.caretaker.phone ?? ""
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
    : buildings;

  const totalBuildings = filteredBuildings.length;
  const totalUnits = filteredBuildings.reduce(
    (sum, building) => sum + building.units.length,
    0
  );
  const occupiedUnits = filteredBuildings.reduce(
    (sum, building) =>
      sum + building.units.filter((unit) => unit.status === "OCCUPIED").length,
    0
  );
  const vacantUnits = filteredBuildings.reduce(
    (sum, building) =>
      sum + building.units.filter((unit) => unit.status === "VACANT").length,
    0
  );
  const activeBuildings = filteredBuildings.filter((building) => building.isActive).length;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(241,245,249,0.92)_100%)]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <section className="overflow-hidden rounded-[28px] border border-white/60 bg-background/90 p-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex w-fit items-center rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Portfolio • Buildings
                </span>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Buildings
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Search buildings, review occupancy, and manage caretaker
                    coverage from one polished dashboard.
                  </p>
                </div>
              </div>

              <Link
                href="/properties"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border/70 bg-background px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
              >
                View Properties
              </Link>
            </div>

            <form method="GET" className="mt-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex h-12 flex-1 items-center gap-3 rounded-2xl border border-border/70 bg-muted/50 px-4 shadow-inner">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>

                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search building, property, location, unit, or caretaker..."
                    className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="h-12 flex-1 rounded-2xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 sm:flex-none"
                  >
                    Search
                  </button>

                  {query ? (
                    <Link
                      href="/buildings"
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-border/70 bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      Clear
                    </Link>
                  ) : null}
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Mobile-first search experience with clean, app-like cards.
              </p>

              {query ? (
                <p className="mt-2 text-xs font-medium text-foreground/80">
                  Showing {filteredBuildings.length} result
                  {filteredBuildings.length === 1 ? "" : "s"} for “{query}”
                </p>
              ) : null}
            </form>
          </section>
        </div>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/60 bg-background/90 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Buildings
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {totalBuildings}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeBuildings} active
            </p>
          </div>

          <div className="rounded-[24px] border border-white/60 bg-background/90 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Units
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{totalUnits}</p>
            <p className="mt-1 text-xs text-muted-foreground">Across visible buildings</p>
          </div>

          <div className="rounded-[24px] border border-white/60 bg-background/90 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Occupied
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {occupiedUnits}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Currently occupied</p>
          </div>

          <div className="rounded-[24px] border border-white/60 bg-background/90 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vacant
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{vacantUnits}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ready for leasing</p>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Building Directory
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cleaner cards on desktop and a more native iOS-style stack on mobile.
              </p>
            </div>

            <span className="hidden rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              {filteredBuildings.length} records
            </span>
          </div>

          {filteredBuildings.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-border/70 bg-background/80 p-10 text-center shadow-sm">
              <p className="text-base font-medium text-foreground">No buildings found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another search term for the building, property, unit, or caretaker.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBuildings.map((building) => {
                const occupied = building.units.filter(
                  (unit) => unit.status === "OCCUPIED"
                ).length;

                const vacant = building.units.filter(
                  (unit) => unit.status === "VACANT"
                ).length;

                const activeUnits = building.units.filter((unit) => unit.isActive).length;

                const occupancyRate = building.units.length
                  ? Math.round((occupied / building.units.length) * 100)
                  : 0;

                const primaryCaretaker =
                  building.caretakerAssignments.find(
                    (assignment) => assignment.isPrimary
                  ) || building.caretakerAssignments[0];

                return (
                  <article
                    key={building.id}
                    className="overflow-hidden rounded-[30px] border border-white/60 bg-background/90 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                            {building.name}
                          </h3>

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                              building.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-700"
                            }`}
                          >
                            {building.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">Property:</span>{" "}
                            <Link
                              href={`/properties/${building.property.id}`}
                              className="font-medium text-foreground underline underline-offset-4"
                            >
                              {building.property.name}
                            </Link>
                          </p>

                          {(building.property.location || building.property.address) && (
                            <p>
                              {[building.property.location, building.property.address]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          )}

                          {building.notes ? (
                            <p className="max-w-2xl leading-6">{building.notes}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
                        <div className="rounded-[22px] border border-border/60 bg-muted/40 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Units
                          </p>
                          <p className="mt-1 text-lg font-semibold text-foreground">
                            {building.units.length}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {activeUnits} active
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-border/60 bg-muted/40 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Occupancy
                          </p>
                          <p className="mt-1 text-lg font-semibold text-foreground">
                            {occupancyRate}%
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {occupied} occupied • {vacant} vacant
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-border/60 bg-muted/40 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Caretaker
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {primaryCaretaker?.caretaker.fullName ?? "Not assigned"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {primaryCaretaker?.caretaker.phone ?? "No phone number"}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-border/60 bg-muted/40 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Created
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {formatDate(building.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Recently added
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-border/60 bg-muted/30 p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-medium text-foreground">Units Preview</h4>
                        <span className="text-xs text-muted-foreground">
                          {building.units.length} total
                        </span>
                      </div>

                      {building.units.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No units added to this building yet.
                        </p>
                      ) : (
                        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                          {building.units.slice(0, 12).map((unit) => (
                            <span
                              key={unit.id}
                              className="inline-flex shrink-0 items-center rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground"
                            >
                              {unit.houseNo} • {unit.status}
                            </span>
                          ))}

                          {building.units.length > 12 ? (
                            <span className="inline-flex shrink-0 items-center rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground">
                              +{building.units.length - 12} more
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}