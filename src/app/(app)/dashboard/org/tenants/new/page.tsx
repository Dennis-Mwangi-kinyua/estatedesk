import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { NewTenantForm } from "./new-tenant-form";

const getCurrentOrgContext = cache(async function getCurrentOrgContext() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/dashboard");
  }

  if (
    !session.activeOrgRole ||
    !["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(
      session.activeOrgRole,
    )
  ) {
    redirect("/dashboard");
  }

  const organization = await prisma.organization.findFirst({
    where: {
      id: session.activeOrgId,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      currencyCode: true,
    },
  });

  if (!organization) {
    redirect("/dashboard");
  }

  return organization;
});

function formatUnitTypeLabel(type: string, bedrooms: number | null) {
  if (type === "APARTMENT") {
    return bedrooms ? `${bedrooms} Bedroom Apartment` : "Apartment";
  }

  if (type === "SINGLE_ROOM") {
    return "Single Room";
  }

  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function NewTenantPage() {
  const org = await getCurrentOrgContext();

  const availableUnits = await prisma.unit.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      status: "VACANT",
      property: {
        orgId: org.id,
        deletedAt: null,
      },
    },
    orderBy: [
      { property: { name: "asc" } },
      { building: { name: "asc" } },
      { houseNo: "asc" },
    ],
    select: {
      id: true,
      houseNo: true,
      type: true,
      bedrooms: true,
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
  });

  const units = availableUnits.map((unit) => ({
    id: unit.id,
    label: [
      unit.property.name,
      unit.building?.name ?? null,
      `Unit ${unit.houseNo}`,
      formatUnitTypeLabel(unit.type, unit.bedrooms),
    ]
      .filter(Boolean)
      .join(" / "),
    rentAmount: Number(unit.rentAmount),
    depositAmount: unit.depositAmount ? Number(unit.depositAmount) : null,
  }));

  return (
    <NewTenantForm
      orgName={org.name}
      currencyCode={org.currencyCode}
      availableUnits={units}
    />
  );
}