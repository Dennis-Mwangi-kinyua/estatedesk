import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewTenantForm } from "./new-tenant-form";

async function getCurrentOrgContext() {
  // TODO: replace with your real auth/session logic
  const membership = await prisma.membership.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      orgId: true,
      userId: true,
      org: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("No active organization context found.");
  }

  return membership;
}

async function getFormOptions(orgId: string) {
  const [units, caretakers] = await Promise.all([
    prisma.unit.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: "VACANT",
        property: {
          orgId,
          deletedAt: null,
          isActive: true,
        },
      },
      orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }],
      select: {
        id: true,
        houseNo: true,
        rentAmount: true,
        depositAmount: true,
        property: {
          select: {
            name: true,
          },
        },
        building: {
          select: {
            name: true,
          },
        },
      },
    }),

    prisma.membership.findMany({
      where: {
        orgId,
        role: "CARETAKER",
        user: {
          deletedAt: null,
          status: "ACTIVE",
        },
      },
      orderBy: {
        user: {
          fullName: "asc",
        },
      },
      select: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
  ]);

  return {
    units: units.map((unit) => ({
      id: unit.id,
      label: `${unit.property.name}${unit.building?.name ? ` • ${unit.building.name}` : ""} • Unit ${unit.houseNo}`,
      houseNo: unit.houseNo,
      rentAmount: unit.rentAmount.toString(),
      depositAmount: unit.depositAmount?.toString() ?? "",
    })),
    caretakers: caretakers.map((item) => ({
      id: item.user.id,
      name: item.user.fullName,
    })),
  };
}

export default async function NewTenantPage() {
  const ctx = await getCurrentOrgContext();
  const options = await getFormOptions(ctx.orgId);

  return (
    <div className="space-y-5 pb-10">
      <div className="space-y-2">
        <Link
          href="/dashboard/org/tenants"
          className="inline-flex text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          ← Back to tenants
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            Add New Tenant
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Create a tenant, assign a unit, and set their login credentials.
          </p>
        </div>
      </div>

      <NewTenantForm
        orgId={ctx.orgId}
        orgName={ctx.org.name}
        units={options.units}
        caretakers={options.caretakers}
      />
    </div>
  );
}