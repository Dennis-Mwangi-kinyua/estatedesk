import "server-only";

import { getCurrentPeriod, getOrgLedger, toLedgerNumber } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import {
  buildSmartInsights,
  type SmartInsightSnapshot,
} from "@/features/insights/lib/smart-insights";

const DAY_MS = 24 * 60 * 60 * 1000;

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export async function getSmartOrgInsights(orgId: string, now = new Date()) {
  const staleVerificationAt = new Date(now.getTime() - 2 * DAY_MS);
  const staleIssueAt = new Date(now.getTime() - 7 * DAY_MS);
  const staleVacancyAt = new Date(now.getTime() - 30 * DAY_MS);
  const in30Days = new Date(now.getTime() + 30 * DAY_MS);
  const in60Days = new Date(now.getTime() + 60 * DAY_MS);
  const period = getCurrentPeriod(now);

  const [
    ledger,
    totalUnits,
    vacantUnits,
    staleVacancies,
    openIssues,
    urgentIssues,
    staleIssues,
    unassignedIssues,
    expiringIn30Days,
    expiringIn60Days,
    unreconciled,
    disputed,
    awaitingVerification,
    staleVerification,
    unappliedPayments,
    missingReferences,
    pendingReadings,
    rejectedReadings,
    currentReadings,
  ] = await Promise.all([
    getOrgLedger(orgId, period, { includeRecentPayments: false }),
    prisma.unit.count({
      where: { isActive: true, deletedAt: null, property: { orgId, deletedAt: null } },
    }),
    prisma.unit.count({
      where: {
        status: "VACANT",
        isActive: true,
        deletedAt: null,
        property: { orgId, deletedAt: null },
      },
    }),
    prisma.unit.findMany({
      where: {
        status: "VACANT",
        vacantSince: { lte: staleVacancyAt },
        isActive: true,
        deletedAt: null,
        property: { orgId, deletedAt: null },
      },
      select: { rentAmount: true },
    }),
    prisma.issueTicket.count({
      where: { orgId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.issueTicket.count({
      where: {
        orgId,
        priority: "URGENT",
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.issueTicket.count({
      where: {
        orgId,
        createdAt: { lte: staleIssueAt },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.issueTicket.count({
      where: {
        orgId,
        assignedToUserId: null,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.lease.count({
      where: {
        orgId,
        status: "ACTIVE",
        deletedAt: null,
        endDate: { gte: now, lte: in30Days },
      },
    }),
    prisma.lease.count({
      where: {
        orgId,
        status: "ACTIVE",
        deletedAt: null,
        endDate: { gte: now, lte: in60Days },
      },
    }),
    prisma.payment.count({
      where: {
        orgId,
        reconciliationStatus: "UNRECONCILED",
        verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] },
      },
    }),
    prisma.payment.count({ where: { orgId, reconciliationStatus: "DISPUTED" } }),
    prisma.payment.count({ where: { orgId, verificationStatus: "PENDING" } }),
    prisma.payment.count({
      where: {
        orgId,
        verificationStatus: "PENDING",
        createdAt: { lte: staleVerificationAt },
      },
    }),
    prisma.payment.count({ where: { orgId, unappliedAmount: { gt: 0 } } }),
    prisma.payment.count({
      where: {
        orgId,
        verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] },
        externalReference: null,
        reference: null,
        checkoutRequestId: null,
      },
    }),
    prisma.meterReading.count({
      where: {
        period,
        status: "SUBMITTED",
        unit: { property: { orgId, deletedAt: null } },
      },
    }),
    prisma.meterReading.count({
      where: {
        period,
        status: "REJECTED",
        unit: { property: { orgId, deletedAt: null } },
      },
    }),
    prisma.meterReading.findMany({
      where: {
        period,
        status: { in: ["SUBMITTED", "APPROVED"] },
        unit: { property: { orgId, deletedAt: null } },
      },
      select: { unitsUsed: true },
    }),
  ]);

  const typicalUsage = median(currentReadings.map((reading) => reading.unitsUsed));
  const unusualThreshold = Math.max(typicalUsage * 2, 20);
  const snapshot: SmartInsightSnapshot = {
    collections: {
      expected: ledger.totals.expected,
      paid: ledger.totals.paid,
      deficit: ledger.totals.deficit,
      defaulted: ledger.totals.defaulted,
      partial: ledger.totals.partial,
    },
    reconciliation: {
      unreconciled,
      disputed,
      awaitingVerification,
      staleVerification,
      unappliedPayments,
      missingReferences,
    },
    occupancy: {
      totalUnits,
      vacantUnits,
      staleVacancies: staleVacancies.length,
      monthlyRentAtRisk: staleVacancies.reduce(
        (sum, unit) => sum + toLedgerNumber(unit.rentAmount),
        0,
      ),
    },
    maintenance: { openIssues, urgentIssues, staleIssues, unassignedIssues },
    leases: { expiringIn30Days, expiringIn60Days },
    water: {
      pendingReadings,
      rejectedReadings,
      unusualReadings: currentReadings.filter(
        (reading) => reading.unitsUsed > unusualThreshold,
      ).length,
    },
  };

  return {
    period,
    generatedAt: now,
    snapshot,
    ...buildSmartInsights(snapshot),
  };
}
