import "server-only";

import type { BillStatus } from "@prisma/client";
import { getPeriodBillsForTenant, getPeriodInvoiceStatus, type PeriodBill } from "@/lib/billing/period-bill";
import { addMonthsToPeriod } from "@/lib/ledger";
import { issueDocumentRecord } from "@/lib/documents/registry";
import type { InvoicePdfData } from "@/lib/documents/invoice-pdf";
import { absoluteUrl } from "@/lib/seo";
import { documentVerificationPath } from "@/lib/documents/identity";
import {
  createInvoiceSnapshot,
  readInvoiceSnapshot,
} from "@/lib/documents/invoice-snapshot";
import { prisma } from "@/lib/prisma";
import { isBillingPeriod } from "@/lib/billing/period-dates";

export function isValidInvoicePeriod(period: string) {
  return isBillingPeriod(period);
}

type InvoiceDocumentRecord = {
  id: string;
  orgId: string;
  serialNumber: string;
  verificationCode: string;
  issuedAt: Date;
  contentHash: string | null;
  status: string;
  metadata?: unknown;
};

export type TenantInvoiceContext = {
  tenant: {
    id: string;
    fullName: string;
    slug: string | null;
    org: {
      id: string;
      name: string;
      address: string | null;
      phone: string | null;
      email: string | null;
      currencyCode: string;
    };
  };
  period: string;
  periodBill: PeriodBill;
  document: InvoiceDocumentRecord;
  pdfData: InvoicePdfData;
  waterBillStatus: BillStatus | null;
};

function parsePeriodBillEntity(document: {
  entityId: string;
  metadata: unknown;
}) {
  const metadata = document.metadata as {
    tenantId?: string;
    historicalLeaseId?: string;
    period?: string;
  } | null;

  if (metadata?.tenantId && metadata.period && isValidInvoicePeriod(metadata.period)) {
    return { tenantId: metadata.tenantId, period: metadata.period, historicalLeaseId: metadata.historicalLeaseId };
  }

  const [tenantId, period] = document.entityId.split(":");
  if (tenantId && period && isValidInvoicePeriod(period)) {
    return { tenantId, period, historicalLeaseId: undefined };
  }

  return null;
}

async function resolveInvoiceDocument({
  orgId,
  tenantId,
  period,
  tenantName,
  propertyName,
  unitHouseNo,
  existingDocument,
  historicalLeaseId,
}: {
  orgId: string;
  tenantId: string;
  period: string;
  tenantName: string;
  propertyName: string;
  unitHouseNo: string;
  existingDocument?: InvoiceDocumentRecord | null;
  historicalLeaseId?: string;
}) {
  if (existingDocument) {
    return existingDocument;
  }

  const entityId = historicalLeaseId ? `${tenantId}:${period}:${historicalLeaseId}` : `${tenantId}:${period}`;
  const found = await prisma.documentRecord.findUnique({
    where: {
      orgId_documentType_entityType_entityId_version: {
        orgId,
        documentType: "INVOICE",
        entityType: "PeriodBill",
        entityId,
        version: 1,
      },
    },
  });

  if (found) {
    return found;
  }

  return prisma.$transaction(async (tx) =>
    issueDocumentRecord({
      db: tx,
      orgId,
      documentType: "INVOICE",
      entityType: "PeriodBill",
      entityId,
      title: `Invoice ${period} — ${tenantName}`,
      issuedAt: new Date(),
      metadata: {
        tenantId,
        period,
        propertyName,
        unitHouseNo,
        ...(historicalLeaseId ? { historicalLeaseId } : {}),
      },
    }),
  );
}

export async function buildPeriodInvoiceContext({
  orgId,
  tenantId,
  period,
  existingDocument,
  historicalLeaseId,
}: {
  orgId: string;
  tenantId: string;
  period: string;
  existingDocument?: InvoiceDocumentRecord | null;
  historicalLeaseId?: string;
}): Promise<TenantInvoiceContext | null> {
  if (!isValidInvoicePeriod(period)) {
    return null;
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      orgId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      slug: true,
      org: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          currencyCode: true,
        },
      },
    },
  });

  if (!tenant) return null;

  const previousPeriod = addMonthsToPeriod(period, -1);

  const bills = await getPeriodBillsForTenant({
    db: prisma,
    orgId,
    tenantId,
    periods: [period, previousPeriod],
    showPendingWater: true,
    historicalLeaseId,
  });
  const periodBill = bills.get(period);
  const previousPeriodBill = bills.get(previousPeriod);
  if (!periodBill) return null;

  const [unit, waterBill, meterReading] = await Promise.all([
    prisma.unit.findUnique({
      where: { id: periodBill.unitId },
      select: { building: { select: { name: true } } },
    }),
    periodBill.waterBillId ? prisma.waterBill.findUnique({
      where: { id: periodBill.waterBillId },
      select: { status: true, unitsUsed: true, ratePerUnit: true, fixedCharge: true },
    }) : null,
    periodBill.waterBillId ? prisma.meterReading.findUnique({
      where: { unitId_period: { unitId: periodBill.unitId, period } },
      select: {
        prevReading: true,
        currentReading: true,
        unitsUsed: true,
        status: true,
        approvedAt: true,
        submittedBy: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } },
      },
    }) : null,
  ]);

  const document = await resolveInvoiceDocument({
    orgId: tenant.org.id,
    tenantId: tenant.id,
    period,
    tenantName: tenant.fullName,
    propertyName: periodBill.propertyName,
    unitHouseNo: periodBill.unitHouseNo,
    existingDocument,
    historicalLeaseId,
  });

  const verificationUrl = absoluteUrl(
    documentVerificationPath(document.verificationCode),
  );

  const pdfData: InvoicePdfData = {
    serialNumber: document.serialNumber,
    verificationCode: document.verificationCode,
    verificationUrl,
    status: getPeriodInvoiceStatus(periodBill),
    issuedAt: document.issuedAt,
    dueDate: periodBill.dueDate,
    period,
    organizationName: tenant.org.name,
    organizationAddress: tenant.org.address,
    organizationPhone: tenant.org.phone,
    organizationEmail: tenant.org.email,
    tenantName: tenant.fullName,
    tenantIdentifier: tenant.slug,
    propertyName: periodBill.propertyName,
    unitName: periodBill.unitHouseNo,
    buildingName: unit?.building?.name ?? null,
    currencyCode: tenant.org.currencyCode,
    amountDue: periodBill.amountDue,
    amountPaid: periodBill.amountPaid,
    balance: periodBill.balance,
    submittedByName: meterReading?.submittedBy?.fullName ?? null,
    confirmedByName: meterReading?.approvedBy?.fullName ?? null,
    confirmedAt: meterReading?.approvedAt ?? null,
    previousBill:
      previousPeriodBill &&
      (previousPeriodBill.amountDue > 0 ||
        previousPeriodBill.lines.some((line) => line.kind === "WATER"))
        ? {
            period: previousPeriod,
            amountDue: previousPeriodBill.amountDue,
            amountPaid: previousPeriodBill.amountPaid,
            balance: previousPeriodBill.balance,
            rentTotal:
              previousPeriodBill.lines.find((line) => line.kind === "RENT")?.amountDue ??
              null,
            waterTotal:
              previousPeriodBill.lines.find((line) => line.kind === "WATER")?.amountDue ??
              null,
            status: getPeriodInvoiceStatus(previousPeriodBill),
          }
        : null,
    lines: periodBill.lines.map((line) => ({
      label: line.label,
      amountDue: line.amountDue,
      amountPaid: line.amountPaid,
      balance: line.balance,
      waterReading:
        line.kind === "WATER" && waterBill
          ? {
              prevReading: meterReading?.prevReading ?? 0,
              currentReading: meterReading?.currentReading ?? 0,
              unitsUsed: Number(waterBill.unitsUsed ?? meterReading?.unitsUsed ?? 0),
              ratePerUnit: Number(waterBill.ratePerUnit ?? 0),
              fixedCharge: Number(waterBill.fixedCharge ?? 0),
              billStatus: waterBill.status.replaceAll("_", " "),
              readingStatus:
                meterReading?.status?.replaceAll("_", " ") ?? "NOT SUBMITTED",
              submittedByName: meterReading?.submittedBy?.fullName ?? null,
              confirmedByName: meterReading?.approvedBy?.fullName ?? null,
            }
          : undefined,
    })),
  };

  const existingMetadata =
    document.metadata &&
    typeof document.metadata === "object" &&
    !Array.isArray(document.metadata)
      ? (document.metadata as Record<string, unknown>)
      : {};

  if (!existingMetadata.invoiceSnapshot) {
    await prisma.documentRecord.update({
      where: { id: document.id },
      data: {
        metadata: {
          ...existingMetadata,
          invoiceSnapshot: createInvoiceSnapshot(pdfData),
        },
      },
    });
  }

  return {
    tenant,
    period,
    periodBill,
    document,
    pdfData,
    waterBillStatus: waterBill?.status ?? null,
  };
}

export async function loadTenantPeriodInvoice(
  userId: string,
  orgId: string,
  period: string,
  historicalLeaseId?: string,
): Promise<TenantInvoiceContext | null> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!tenant) return null;

  return buildPeriodInvoiceContext({
    orgId,
    tenantId: tenant.id,
    period,
    historicalLeaseId,
  });
}

export async function loadVerifiedPeriodInvoiceByCode(
  verificationCode: string,
): Promise<(TenantInvoiceContext & { documentValid: boolean }) | null> {
  const document = await prisma.documentRecord.findUnique({
    where: { verificationCode },
  });

  if (
    !document ||
    document.documentType !== "INVOICE" ||
    document.entityType !== "PeriodBill"
  ) {
    return null;
  }

  const entity = parsePeriodBillEntity(document);
  if (!entity) return null;

  const expired = document.expiresAt ? document.expiresAt <= new Date() : false;
  const documentValid =
    !expired && ["ISSUED", "COMPLETED"].includes(document.status);

  const context = await buildPeriodInvoiceContext({
    orgId: document.orgId,
    tenantId: entity.tenantId,
    period: entity.period,
    existingDocument: document,
    historicalLeaseId: entity.historicalLeaseId,
  });

  if (context) {
    return {
      ...context,
      documentValid,
    };
  }

  const snapshot = readInvoiceSnapshot(document.metadata);
  if (!snapshot) return null;

  const tenant = await prisma.tenant.findFirst({
    where: {
      id: entity.tenantId,
      orgId: document.orgId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      slug: true,
      org: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          currencyCode: true,
        },
      },
    },
  });

  if (!tenant) return null;

  return {
    tenant,
    period: entity.period,
    periodBill: {
      period: entity.period,
      leaseId: "",
      unitId: "",
      propertyName: snapshot.propertyName,
      unitHouseNo: snapshot.unitName,
      dueDate: snapshot.dueDate,
      lines: snapshot.lines.map((line, index) => ({
        kind: line.waterReading ? ("WATER" as const) : index === 0 ? ("RENT" as const) : ("OTHER" as const),
        id: `snapshot-${index}`,
        label: line.label,
        amountDue: line.amountDue,
        amountPaid: line.amountPaid,
        balance: line.balance,
      })),
      amountDue: snapshot.amountDue,
      amountPaid: snapshot.amountPaid,
      balance: snapshot.balance,
      isPaid: snapshot.status === "PAID",
      waterPendingApproval: snapshot.lines.some((line) => line.waterReading?.billStatus === "PENDING APPROVAL"),
      rentChargeId: null,
      waterBillId: null,
    },
    document,
    pdfData: snapshot,
    waterBillStatus: null,
    documentValid,
  };
}

export function isVerifiedDocumentAccessible(document: {
  status: string;
  expiresAt: Date | null;
}) {
  const expired = document.expiresAt ? document.expiresAt <= new Date() : false;
  return !expired && ["ISSUED", "COMPLETED"].includes(document.status);
}