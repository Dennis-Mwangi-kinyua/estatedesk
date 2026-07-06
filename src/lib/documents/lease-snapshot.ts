import type { Prisma, PrismaClient } from "@prisma/client";

type DocumentDb = PrismaClient | Prisma.TransactionClient;

export type LeaseSnapshot = {
  organizationName: string;
  organizationAddress: string | null;
  organizationPhone: string | null;
  organizationEmail: string | null;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string | null;
  tenantNationalIdMasked: string | null;
  tenantStatus: string;
  tenantBelongsToOrg: boolean;
  leaseId: string;
  leaseStatus: string;
  propertyName: string;
  buildingName: string | null;
  unitName: string;
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  deposit: number | null;
  dueDay: number;
  currencyCode: string;
  contractFileName: string;
  sourceContractHash: string;
};

function maskIdentifier(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 4) return "****";

  return `${"*".repeat(Math.min(trimmed.length - 4, 6))}${trimmed.slice(-4)}`;
}

export async function createLeaseSnapshot(
  db: DocumentDb,
  leaseId: string,
  sourceContractHash: string,
  contractFileName: string,
): Promise<LeaseSnapshot> {
  const lease = await db.lease.findUniqueOrThrow({
    where: { id: leaseId },
    include: {
      org: {
        select: {
          name: true,
          address: true,
          phone: true,
          email: true,
          currencyCode: true,
        },
      },
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          nationalId: true,
          status: true,
          orgId: true,
          deletedAt: true,
        },
      },
      unit: {
        include: {
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
      },
    },
  });

  return {
    organizationName: lease.org.name,
    organizationAddress: lease.org.address,
    organizationPhone: lease.org.phone,
    organizationEmail: lease.org.email,
    tenantId: lease.tenant.id,
    tenantName: lease.tenant.fullName,
    tenantPhone: lease.tenant.phone,
    tenantEmail: lease.tenant.email,
    tenantNationalIdMasked: maskIdentifier(lease.tenant.nationalId),
    tenantStatus: lease.tenant.status,
    tenantBelongsToOrg:
      lease.tenant.orgId === lease.orgId && lease.tenant.deletedAt === null,
    leaseId: lease.id,
    leaseStatus: lease.status,
    propertyName: lease.unit.property.name,
    buildingName: lease.unit.building?.name ?? null,
    unitName: lease.unit.houseNo,
    startDate: lease.startDate.toISOString(),
    endDate: lease.endDate?.toISOString() ?? null,
    monthlyRent: Number(lease.monthlyRent),
    deposit: lease.deposit == null ? null : Number(lease.deposit),
    dueDay: lease.dueDay,
    currencyCode: lease.org.currencyCode,
    contractFileName,
    sourceContractHash,
  };
}

export function readLeaseSnapshot(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const snapshot = (metadata as Record<string, Prisma.JsonValue>).leaseSnapshot;

  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }

  return snapshot as unknown as LeaseSnapshot;
}