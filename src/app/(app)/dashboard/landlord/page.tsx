import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Home, LogOut, Receipt, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";

export const dynamic = "force-dynamic";

function formatCurrency(value: unknown) {
  const amount =
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function LandlordDashboardPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/login");
  }

  if (session.activeOrgRole !== "LANDLORD") {
    redirect("/dashboard");
  }

  const access = await requireActiveSubscription(session.activeOrgId);

  const profile = await prisma.landlordProfile.findFirst({
    where: {
      orgId: session.activeOrgId,
      userId: session.userId,
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      displayName: true,
      assignments: {
        where: {
          active: true,
          endedAt: null,
        },
        select: {
          property: {
            select: {
              id: true,
              name: true,
              location: true,
              address: true,
              units: {
                where: {
                  deletedAt: null,
                  isActive: true,
                },
                select: {
                  id: true,
                  houseNo: true,
                  rentAmount: true,
                  status: true,
                  leases: {
                    where: {
                      deletedAt: null,
                      status: "ACTIVE",
                    },
                    select: {
                      tenant: {
                        select: {
                          fullName: true,
                        },
                      },
                    },
                    take: 1,
                  },
                },
                orderBy: {
                  houseNo: "asc",
                },
              },
            },
          },
          unit: {
            select: {
              id: true,
              houseNo: true,
              rentAmount: true,
              status: true,
              property: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                  address: true,
                },
              },
              leases: {
                where: {
                  deletedAt: null,
                  status: "ACTIVE",
                },
                select: {
                  tenant: {
                    select: {
                      fullName: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] p-4">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          No active landlord profile is linked to this account.
        </div>
      </div>
    );
  }

  const propertyMap = new Map<
    string,
    {
      id: string;
      name: string;
      location: string | null;
      address: string | null;
      units: Array<{
        id: string;
        houseNo: string;
        rentAmount: unknown;
        status: string;
        tenantName: string | null;
      }>;
    }
  >();

  for (const assignment of profile.assignments) {
    if (assignment.property) {
      propertyMap.set(assignment.property.id, {
        id: assignment.property.id,
        name: assignment.property.name,
        location: assignment.property.location,
        address: assignment.property.address,
        units: assignment.property.units.map((unit) => ({
          id: unit.id,
          houseNo: unit.houseNo,
          rentAmount: unit.rentAmount,
          status: unit.status,
          tenantName: unit.leases[0]?.tenant.fullName ?? null,
        })),
      });
    }

    if (assignment.unit) {
      const property = assignment.unit.property;
      const existing =
        propertyMap.get(property.id) ??
        {
          id: property.id,
          name: property.name,
          location: property.location,
          address: property.address,
          units: [],
        };

      if (!existing.units.some((unit) => unit.id === assignment.unit?.id)) {
        existing.units.push({
          id: assignment.unit.id,
          houseNo: assignment.unit.houseNo,
          rentAmount: assignment.unit.rentAmount,
          status: assignment.unit.status,
          tenantName: assignment.unit.leases[0]?.tenant.fullName ?? null,
        });
      }

      propertyMap.set(property.id, existing);
    }
  }

  const properties = Array.from(propertyMap.values());
  const units = properties.flatMap((property) => property.units);
  const occupiedUnits = units.filter((unit) => unit.status === "OCCUPIED").length;
  const monthlyRent = units.reduce((total, unit) => total + Number(unit.rentAmount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="ios-panel rounded-[28px] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Landlord workspace
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                {profile.displayName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                View only the apartments and units linked exclusively to your
                landlord account.
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="ios-button inline-flex h-11 w-11 items-center justify-center border border-red-200 bg-red-50 text-red-700"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        <SubscriptionWarning access={access} />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Properties",
              value: properties.length.toLocaleString(),
              icon: Building2,
            },
            {
              label: "Units",
              value: units.length.toLocaleString(),
              icon: Home,
            },
            {
              label: "Occupied",
              value: occupiedUnits.toLocaleString(),
              icon: Users,
            },
            {
              label: "Monthly Rent",
              value: formatCurrency(monthlyRent),
              icon: Receipt,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="ios-card rounded-[24px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-neutral-950">
                      {item.value}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-4">
          {properties.length === 0 ? (
            <div className="ios-card rounded-[28px] p-8 text-center text-sm text-neutral-500">
              No properties have been linked to this landlord account yet.
            </div>
          ) : (
            properties.map((property) => (
              <article key={property.id} className="ios-card rounded-[28px] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">
                      {property.name}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {[property.location, property.address].filter(Boolean).join(" - ") ||
                        "No location added"}
                    </p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                    {property.units.length} unit{property.units.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {property.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="rounded-2xl border border-neutral-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">
                            Unit {unit.houseNo}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {unit.tenantName ?? "Vacant"}
                          </p>
                        </div>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                          {unit.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-neutral-950">
                        {formatCurrency(unit.rentAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>

        <div className="pb-8 text-center text-xs text-neutral-500">
          <Link href="/dashboard" className="font-medium text-neutral-700 underline">
            Refresh workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
