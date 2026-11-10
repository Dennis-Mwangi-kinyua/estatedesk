import "server-only";

import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { getIssueSlaState } from "@/lib/issues/sla";
import { loadUnremindedArrears } from "@/lib/workflow/arrears-queue-query";

export type OperatingItem = {
  id: string;
  who: string;
  where: string;
  amount: string | null;
  since: Date;
  href: string;
  action: string;
  status: string;
  actionKind?: "link" | "approve-reading" | "send-reminder";
  actionFields?: { readingId?: string; leaseId?: string; period?: string };
};

export type OperatingGroup = {
  id: string;
  title: string;
  owner: string;
  nextAction: string;
  href: string;
  total: number;
  items: OperatingItem[];
};

const TAKE = 25;

function money(amount: { toString(): string } | number, currency: string) {
  const value = typeof amount === "number" ? amount : Number(amount);
  try {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-KE")}`;
  }
}

export async function getOperatingQueue(orgId: string, currency = "KES", now = new Date(), db: PrismaClient = prisma): Promise<OperatingGroup[]> {
  const openIssueWhere = { orgId, status: { in: ["OPEN", "IN_PROGRESS"] as ("OPEN" | "IN_PROGRESS")[] } };
  const overdueIssues = { ...openIssueWhere, OR: ([ ["URGENT", 4], ["HIGH", 24], ["MEDIUM", 72], ["LOW", 168] ] as const).map(([priority, hours]) => ({ priority, createdAt: { lte: new Date(now.getTime() - hours * 3600000) } })) };
  const [
    proofCount,
    proofs,
    readingCount,
    readings,
    envelopeCount,
    envelopes,
    unreminded,
    oldIssueCount,
    oldIssues,
    moveOutCount,
    moveOuts,
    subscription,
  ] = await Promise.all([
    db.payment.count({ where: { orgId, reversedAt: null, verificationStatus: "PENDING", method: { in: ["MPESA_MANUAL", "BANK", "CASH"] } } }),
    db.payment.findMany({
      where: { orgId, reversedAt: null, verificationStatus: "PENDING", method: { in: ["MPESA_MANUAL", "BANK", "CASH"] } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: TAKE,
      select: {
        id: true,
        amount: true,
        method: true,
        reference: true,
        createdAt: true,
        payerTenant: { select: { fullName: true } },
        rentCharge: { select: { period: true, leaseId: true, lease: { select: { unit: { select: { houseNo: true } } } } } },
        waterBill: { select: { period: true, unit: { select: { houseNo: true } } } },
      },
    }),
    db.meterReading.count({ where: { status: "SUBMITTED", unit: { deletedAt: null, property: { orgId, deletedAt: null } } } }),
    db.meterReading.findMany({
      where: { status: "SUBMITTED", unit: { deletedAt: null, property: { orgId, deletedAt: null } } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: TAKE,
      select: {
        id: true,
        period: true,
        createdAt: true,
        unit: {
          select: {
            houseNo: true,
            leases: {
              where: { orgId, deletedAt: null, status: "ACTIVE" },
              take: 1,
              select: { id: true, tenant: { select: { fullName: true } } },
            },
          },
        },
      },
    }),
    db.leaseSignatureEnvelope.count({ where: { orgId, status: { in: ["PENDING", "PARTIALLY_SIGNED"] }, expiresAt: { gt: now }, cancelledAt: null } }),
    db.leaseSignatureEnvelope.findMany({
      where: { orgId, status: { in: ["PENDING", "PARTIALLY_SIGNED"] }, expiresAt: { gt: now }, cancelledAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: TAKE,
      select: { id: true, leaseId: true, status: true, createdAt: true, lease: { select: { tenant: { select: { fullName: true } }, unit: { select: { houseNo: true } } } } },
    }),
    loadUnremindedArrears(db, orgId, now),
    db.issueTicket.count({ where: overdueIssues }),
    db.issueTicket.findMany({
      where: overdueIssues,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: TAKE,
      select: { id: true, title: true, priority: true, status: true, createdAt: true, unit: { select: { houseNo: true } } },
    }),
    db.moveOutNotice.count({ where: { status: { notIn: ["CLOSED", "CANCELLED"] }, lease: { orgId, deletedAt: null } } }),
    db.moveOutNotice.findMany({
      where: { status: { notIn: ["CLOSED", "CANCELLED"] }, lease: { orgId, deletedAt: null } },
      orderBy: [{ noticeDate: "asc" }, { id: "asc" }],
      take: TAKE,
      select: { id: true, status: true, noticeDate: true, tenant: { select: { fullName: true } }, lease: { select: { unit: { select: { houseNo: true } } } } },
    }),
    db.subscription.findUnique({ where: { orgId }, select: { plan: true } }),
  ]);

  const issueItems = oldIssues;

  const groups = [
    {
      id: "proofs",
      title: "Manual payment proofs",
      owner: "Accountant",
      nextAction: "Allocate the payment or reject the proof.",
      href: "/dashboard/org/payments",
      total: proofCount,
      items: proofs.map((payment) => {
        const leaseId = payment.rentCharge?.leaseId;
        const period = payment.rentCharge?.period ?? payment.waterBill?.period;
        const where = payment.rentCharge?.lease.unit.houseNo ?? payment.waterBill?.unit.houseNo ?? "No unit";
        return {
          id: payment.id,
          who: payment.payerTenant?.fullName ?? "Payment",
          where,
          amount: money(payment.amount, currency),
          since: payment.createdAt,
          href: leaseId && period ? `/dashboard/org/charges/bills/${leaseId}?period=${period}` : `/dashboard/org/payments?q=${encodeURIComponent(payment.reference || payment.payerTenant?.fullName || "")}`,
          action: "Verify payment",
          status: payment.method,
        };
      }),
    },
    {
      id: "readings",
      title: "Meter readings to approve",
      owner: "Office",
      nextAction: "Approve the reading so water is on the period bill.",
      href: "/dashboard/org/water-bills",
      total: readingCount,
      items: readings.map((reading) => {
        const lease = reading.unit.leases[0];
        return {
          id: reading.id,
          who: lease?.tenant.fullName ?? "No active tenant",
          where: `Unit ${reading.unit.houseNo}`,
          amount: null,
          since: reading.createdAt,
          href: lease ? `/dashboard/org/charges/bills/${lease.id}?period=${reading.period}` : `/dashboard/org/water-bills/readings/${reading.id}`,
          action: "Approve reading",
          actionKind: lease ? "approve-reading" : "link",
          actionFields: { readingId: reading.id },
          status: reading.period,
        };
      }),
    },
    {
      id: "leases",
      title: "Unsigned leases",
      owner: "Office",
      nextAction: "The tenant signs, or the envelope is withdrawn.",
      href: "/dashboard/org/leases",
      total: envelopeCount,
      items: envelopes.map((envelope) => ({
        id: envelope.id,
        who: envelope.lease.tenant.fullName,
        where: `Unit ${envelope.lease.unit.houseNo}`,
        amount: null,
        since: envelope.createdAt,
        href: `/dashboard/org/leases/${envelope.leaseId}/signing`,
        action: "Open signing",
        status: envelope.status,
      })),
    },
    {
      id: "arrears",
      title: "Arrears with no reminder this month",
      owner: "Office",
      nextAction: "Send the balance reminder for this period.",
      href: "/dashboard/org/charges/bills",
      total: unreminded.total,
      items: unreminded.items.slice(0, TAKE).map((charge) => ({
        id: charge.id,
        who: charge.lease.tenant.fullName,
        where: `Unit ${charge.lease.unit.houseNo}`,
        amount: money(charge.balance, currency),
        since: charge.dueDate,
        href: `/dashboard/org/charges/bills/${charge.leaseId}?period=${charge.period}`,
        action: "Send reminder",
        actionKind: "send-reminder" as const,
        actionFields: { leaseId: charge.leaseId, period: charge.period },
        status: charge.period,
      })),
    },
    {
      id: "issues",
      title: "Issues past SLA",
      owner: "Caretaker or office",
      nextAction: "Assign, update, or close the issue.",
      href: "/dashboard/org/issues",
      total: oldIssueCount,
      items: issueItems.map((issue) => ({
        id: issue.id,
        who: issue.title,
        where: issue.unit ? `Unit ${issue.unit.houseNo}` : "No unit",
        amount: null,
        since: issue.createdAt,
        href: `/dashboard/org/issues/${issue.id}`,
        action: "Update issue",
        status: getIssueSlaState({ ...issue, now })?.label ?? issue.status,
      })),
    },
    {
      id: "move-outs",
      title: "Move-outs in progress",
      owner: "Office",
      nextAction: "Finish the inspection, settlement, and unit readiness.",
      href: "/dashboard/org/move-outs",
      total: moveOutCount,
      items: moveOuts.map((notice) => ({
        id: notice.id,
        who: notice.tenant.fullName,
        where: `Unit ${notice.lease.unit.houseNo}`,
        amount: null,
        since: notice.noticeDate,
        href: `/dashboard/org/move-outs/${notice.id}`,
        action: "Continue move-out",
        status: notice.status,
      })),
    },
  ];
  if (subscription?.plan === "FREE") return groups.filter((group) => group.id !== "issues" && group.id !== "move-outs");
  return groups;
}
