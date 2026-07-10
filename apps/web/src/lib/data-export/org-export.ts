import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createZip, rowsToCsv } from "@/lib/data-export/csv-zip";
import {
  assertWithinSyncExportLimit,
  syncExportTake,
} from "@/lib/data-export/limits";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";

type PrimitiveRecord = Record<string, string | number | boolean | Date | null | undefined>;

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function slugifyFilePart(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function getOrganizationExportData(orgId: string) {
  const query = <T>(label: string, operation: () => Promise<T>) =>
    retryTransientDatabaseOperation(operation, {
      attempts: 3,
      delayMs: 500,
      label,
    });

  const organization = await query("data-export-organization", () =>
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        address: true,
        status: true,
        currencyCode: true,
        timezone: true,
        dataRetentionDays: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  );

  const take = syncExportTake();

  const memberships = assertWithinSyncExportLimit(
    "memberships",
    await query("data-export-memberships", () =>
      prisma.membership.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        role: true,
        scopeType: true,
        scopeId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            platformRole: true,
          },
        },
      },
      }),
    ),
  );

  const properties = assertWithinSyncExportLimit(
    "properties",
    await query("data-export-properties", () =>
      prisma.property.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        type: true,
        waterRatePerUnit: true,
        waterFixedCharge: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  const buildings = assertWithinSyncExportLimit(
    "buildings",
    await query("data-export-buildings", () =>
      prisma.building.findMany({
      where: { property: { orgId } },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        propertyId: true,
        name: true,
        notes: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  const units = assertWithinSyncExportLimit(
    "units",
    await query("data-export-units", () =>
      prisma.unit.findMany({
      where: { property: { orgId } },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        propertyId: true,
        buildingId: true,
        houseNo: true,
        type: true,
        bedrooms: true,
        bathrooms: true,
        floorArea: true,
        rentAmount: true,
        depositAmount: true,
        status: true,
        vacantSince: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  const tenants = assertWithinSyncExportLimit(
    "tenants",
    await query("data-export-tenants", () =>
      prisma.tenant.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        userId: true,
        type: true,
        fullName: true,
        companyName: true,
        kraPin: true,
        phone: true,
        email: true,
        nationalId: true,
        status: true,
        dataConsent: true,
        marketingConsent: true,
        archivedAt: true,
        blacklistedAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  const leases = assertWithinSyncExportLimit(
    "leases",
    await query("data-export-leases", () =>
      prisma.lease.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        unitId: true,
        tenantId: true,
        caretakerUserId: true,
        startDate: true,
        endDate: true,
        dueDay: true,
        monthlyRent: true,
        deposit: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  const rentCharges = assertWithinSyncExportLimit(
    "rent charges",
    await query("data-export-rent-charges", () =>
      prisma.rentCharge.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        leaseId: true,
        period: true,
        amountDue: true,
        amountPaid: true,
        balance: true,
        dueDate: true,
        status: true,
        chargeType: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  const waterBills = assertWithinSyncExportLimit(
    "water bills",
    await query("data-export-water-bills", () =>
      prisma.waterBill.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        unitId: true,
        tenantId: true,
        period: true,
        unitsUsed: true,
        ratePerUnit: true,
        fixedCharge: true,
        total: true,
        dueDate: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  const payments = assertWithinSyncExportLimit(
    "payments",
    await query("data-export-payments", () =>
      prisma.payment.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        payerTenantId: true,
        payerUserId: true,
        rentChargeId: true,
        waterBillId: true,
        amount: true,
        method: true,
        targetType: true,
        gatewayStatus: true,
        verificationStatus: true,
        paidAt: true,
        reference: true,
        externalReference: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  const issues = assertWithinSyncExportLimit(
    "issues",
    await query("data-export-issues", () =>
      prisma.issueTicket.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        propertyId: true,
        unitId: true,
        reportedByUserId: true,
        assignedToUserId: true,
        title: true,
        priority: true,
        status: true,
        description: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  const notifications = assertWithinSyncExportLimit(
    "notifications",
    await query("data-export-notifications", () =>
      prisma.notification.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        userId: true,
        tenantId: true,
        channel: true,
        type: true,
        status: true,
        title: true,
        sentAt: true,
        readAt: true,
        createdAt: true,
      },
      }),
    ),
  );

  const assets = assertWithinSyncExportLimit(
    "assets",
    await query("data-export-assets", () =>
      prisma.asset.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      take,
      select: {
        id: true,
        fileName: true,
        fileType: true,
        mimeType: true,
        size: true,
        assetType: true,
        uploadedByUserId: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      }),
    ),
  );

  return { organization, memberships, properties, buildings, units, tenants, leases, rentCharges, waterBills, payments, issues, notifications, assets };
}

export async function buildOrganizationCsvZip(orgId: string) {
  const data = await getOrganizationExportData(orgId);
  const generatedAt = new Date();
  const orgSlug = slugifyFilePart(data.organization.slug || data.organization.name || orgId);

  const files: Array<{ name: string; rows: PrimitiveRecord[] }> = [
    {
      name: "organization.csv",
      rows: [
        {
          ...data.organization,
          exportedAt: generatedAt,
        },
      ],
    },
    {
      name: "memberships.csv",
      rows: data.memberships.map((membership) => ({
        id: membership.id,
        userId: membership.user.id,
        fullName: membership.user.fullName,
        email: membership.user.email,
        phone: membership.user.phone,
        userStatus: membership.user.status,
        platformRole: membership.user.platformRole,
        orgRole: membership.role,
        scopeType: membership.scopeType,
        scopeId: membership.scopeId,
        createdAt: membership.createdAt,
        updatedAt: membership.updatedAt,
      })),
    },
    {
      name: "properties.csv",
      rows: data.properties.map((row) => ({
        ...row,
        waterRatePerUnit: toNumber(row.waterRatePerUnit),
        waterFixedCharge: toNumber(row.waterFixedCharge),
      })),
    },
    { name: "buildings.csv", rows: data.buildings },
    {
      name: "units.csv",
      rows: data.units.map((row) => ({
        ...row,
        rentAmount: toNumber(row.rentAmount),
        depositAmount: toNumber(row.depositAmount),
      })),
    },
    { name: "tenants.csv", rows: data.tenants },
    {
      name: "leases.csv",
      rows: data.leases.map((row) => ({
        ...row,
        monthlyRent: toNumber(row.monthlyRent),
        deposit: toNumber(row.deposit),
      })),
    },
    {
      name: "rent-charges.csv",
      rows: data.rentCharges.map((row) => ({
        ...row,
        amountDue: toNumber(row.amountDue),
        amountPaid: toNumber(row.amountPaid),
        balance: toNumber(row.balance),
      })),
    },
    {
      name: "water-bills.csv",
      rows: data.waterBills.map((row) => ({
        ...row,
        ratePerUnit: toNumber(row.ratePerUnit),
        fixedCharge: toNumber(row.fixedCharge),
        total: toNumber(row.total),
      })),
    },
    {
      name: "payments.csv",
      rows: data.payments.map((row) => ({
        ...row,
        amount: toNumber(row.amount),
      })),
    },
    { name: "issues.csv", rows: data.issues },
    { name: "notifications.csv", rows: data.notifications },
    { name: "assets.csv", rows: data.assets },
  ];

  const zip = createZip(
    files.map((file) => ({
      name: `${orgSlug}/${file.name}`,
      content: rowsToCsv(file.rows),
    })),
  );

  return {
    fileName: `${orgSlug}-data-export-${generatedAt.toISOString().slice(0, 10)}.zip`,
    zip,
  };
}
