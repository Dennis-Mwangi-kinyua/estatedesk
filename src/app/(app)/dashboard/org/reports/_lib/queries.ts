import { getCurrentPeriod, getOrgLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import {
  filterRowsByPayment,
  PAYMENT_FILTERS,
  ratingForTenant,
} from "./helpers";
import type { ReportsSearchParams } from "./types";

export async function loadReportsPageData(
  orgId: string,
  searchParams?: ReportsSearchParams,
) {
  const selectedApartment = searchParams?.apartment ?? "all";
  const selectedPayment = searchParams?.payment ?? "all";
  const period = searchParams?.period ?? getCurrentPeriod();
  const ledger = await getOrgLedger(orgId, period, {
    recentPaymentsTake: 10,
  });

  const dueDays = await prisma.lease.findMany({
    where: {
      orgId,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      tenantId: true,
      dueDay: true,
    },
  });
  const dueDayByTenant = new Map(dueDays.map((lease) => [lease.tenantId, lease.dueDay]));

  const rows = ledger.rows.map((row) => {
    const rating = ratingForTenant({
      paymentStatus: row.paymentStatus,
      balance: row.balance,
      amountDue: row.amountDue,
      amountPaid: row.amountPaid,
      lastPaymentAt: row.lastPaymentAt,
      dueDay: dueDayByTenant.get(row.tenantId) ?? null,
    });

    return {
      ...row,
      rating,
      dueDay: dueDayByTenant.get(row.tenantId) ?? null,
    };
  });

  const apartmentOptions = Array.from(
    new Set(rows.map((row) => row.propertyName).filter((name) => name && name !== "-")),
  ).sort((a, b) => a.localeCompare(b));
  const apartmentRows =
    selectedApartment === "all"
      ? rows
      : rows.filter((row) => row.propertyName === selectedApartment);
  const filteredRows = filterRowsByPayment(apartmentRows, selectedPayment);
  const paidRows = filteredRows.filter((row) => row.amountDue > 0 && row.balance <= 0);
  const notPaidRows = filteredRows.filter((row) => row.amountDue > 0 && row.balance > 0);
  const scopedTotals = {
    expected: filteredRows.reduce((sum, row) => sum + row.amountDue, 0),
    paid: filteredRows.reduce((sum, row) => sum + row.amountPaid, 0),
    deficit: filteredRows.reduce((sum, row) => sum + row.deficit, 0),
  };
  const collectionRate = scopedTotals.expected
    ? (scopedTotals.paid / scopedTotals.expected) * 100
    : 0;
  const activePaymentFilter =
    PAYMENT_FILTERS.find((filter) => filter.value === selectedPayment) ?? PAYMENT_FILTERS[0];
  const recentExports = await prisma.reportExport.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      reportType: true,
      period: true,
      fileName: true,
      createdAt: true,
    },
  });

  return {
    period,
    selectedApartment,
    selectedPayment,
    apartmentOptions,
    filteredRows,
    paidRows,
    notPaidRows,
    scopedTotals,
    collectionRate,
    activePaymentFilter,
    recentExports,
  };
}