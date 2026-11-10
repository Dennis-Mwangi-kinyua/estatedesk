"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { NotificationChannel, NotificationType, Prisma } from "@prisma/client";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { ensureLeasePeriodCharges, issueOrgPeriodCharges } from "@/lib/billing/issue-period-charges";
import { isBillingPeriod } from "@/lib/billing/period-dates";
import { isPayableWaterBillStatus } from "@/lib/water-bills/status";
import { getCurrentPeriod } from "@/lib/ledger-utils";
import { postRentChargeAccrual } from "@/lib/accounting/billing";
import { notifyRecipients } from "@/lib/notifications/notify";
import { absoluteUrl } from "@/lib/seo";
import { formatLedgerCurrency } from "@/lib/ledger-utils";
import { getPeriodBillForTenant } from "@/lib/billing/period-bill";
import { verifyPayment } from "@/app/(app)/dashboard/org/payments/_lib/verify-payment";
import { requirePaymentReviewer } from "@/app/(app)/dashboard/org/payments/_lib/payment-action-shared";
import { processPeriodBillPayment } from "@/app/(app)/dashboard/tenant/payments/checkout/_lib/handlers/period-bill-payment";
import { isMpesaStkConfigured } from "@/lib/mpesa/config";
import { getMpesaAccessTokenForOrg, MpesaRequestError, normalizeMpesaPhone, requestMpesaStkPush } from "@/lib/mpesa/client";

async function requireBillOrg() {
  const session = await requireManagementAccess();
  if (!session.activeOrgId) throw new Error("Missing active organization.");
  return { session, orgId: session.activeOrgId };
}

function billPath(period: string, leaseId?: string, notice?: string) {
  const path = leaseId ? `/dashboard/org/charges/bills/${leaseId}` : "/dashboard/org/charges/bills";
  const params = new URLSearchParams({ period });
  if (notice) params.set("notice", notice);
  return `${path}?${params.toString()}`;
}

function revalidateBills(leaseId?: string) {
  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/charges");
  revalidatePath("/dashboard/org/charges/bills");
  revalidatePath("/dashboard/org/operating-queue");
  if (leaseId) revalidatePath(`/dashboard/org/charges/bills/${leaseId}`);
}

export async function issuePeriodBillsAction(formData: FormData) {
  const { session, orgId } = await requireBillOrg();
  const period = String(formData.get("period") ?? getCurrentPeriod());
  if (!isBillingPeriod(period)) redirect(billPath(getCurrentPeriod(), undefined, "invalid-period"));
  const result = await issueOrgPeriodCharges(orgId, period);
  await prisma.auditLog.create({
    data: {
      orgId,
      actorUserId: session.userId,
      action: "PERIOD_BILLS_ISSUED",
      entityType: "Organization",
      entityId: orgId,
      metadata: { period, leases: result.leases, created: result.created },
    },
  });
  revalidateBills();
  redirect(billPath(period, undefined, `issued-${result.created}`));
}

const QUEUE_RETURNS = new Set(["/dashboard/org", "/dashboard/org/operating-queue"]);

async function remindLeasePeriod(input: {
  orgId: string;
  actorUserId: string;
  leaseId: string;
  period: string;
  tenantId: string;
  userId: string | null;
  tenantName: string;
  houseNo: string;
  balance: number;
  dueDate: Date | null;
}) {
  const overdue = input.dueDate ? input.dueDate.getTime() < Date.now() - 5 * 86_400_000 : false;
  const invoiceUrl = absoluteUrl("/dashboard/tenant/invoice");
  const result = await notifyRecipients({
    db: prisma,
    orgId: input.orgId,
    actorUserId: input.actorUserId,
    recipients: [{ tenantId: input.tenantId, userId: input.userId }],
    channels: [NotificationChannel.IN_APP, NotificationChannel.SMS, NotificationChannel.WHATSAPP, NotificationChannel.EMAIL],
    type: overdue ? NotificationType.RENT_OVERDUE_REMINDER : NotificationType.RENT_DUE_REMINDER,
    title: overdue ? "Rent payment warning" : "Rent payment due",
    message: `${input.tenantName}, the ${input.period} balance for unit ${input.houseNo} is ${formatLedgerCurrency(input.balance)}. Pay from ${invoiceUrl}.`,
    actionUrl: "/dashboard/tenant/invoice",
    eventKey: `period-bill-reminder:${input.leaseId}:${input.period}:${new Date().toISOString().slice(0, 10)}`,
  });
  return result.count > 0;
}

export async function remindUnpaidBillsAction(formData: FormData) {
  const { session, orgId } = await requireBillOrg();
  const period = String(formData.get("period") ?? getCurrentPeriod());
  if (!isBillingPeriod(period)) redirect(billPath(getCurrentPeriod(), undefined, "invalid-period"));
  const leases = await prisma.lease.findMany({
    where: { orgId, deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      tenantId: true,
      unitId: true,
      tenant: { select: { fullName: true, userId: true } },
      unit: { select: { houseNo: true } },
      rentCharges: { where: { period }, select: { balance: true, status: true, dueDate: true } },
    },
  });
  const unitIds = leases.map((lease) => lease.unitId);
  const waterBills = unitIds.length
    ? await prisma.waterBill.findMany({
      where: { orgId, period, unitId: { in: unitIds } },
      select: { unitId: true, balance: true, status: true, dueDate: true },
    })
    : [];
  const waterByUnit = new Map(waterBills.map((bill) => [bill.unitId, bill]));
  let sent = 0;
  let already = 0;
  for (const lease of leases) {
    const chargeBalance = lease.rentCharges.filter((charge) => charge.status !== "WAIVED").reduce((sum, charge) => sum + Number(charge.balance), 0);
    const water = waterByUnit.get(lease.unitId);
    const waterBalance = water && isPayableWaterBillStatus(water.status) ? Number(water.balance) : 0;
    const balance = chargeBalance + waterBalance;
    if (balance <= 0) continue;
    const dueDate = lease.rentCharges.map((charge) => charge.dueDate).sort((a, b) => a.getTime() - b.getTime())[0] ?? water?.dueDate ?? null;
    const delivered = await remindLeasePeriod({
      orgId,
      actorUserId: session.userId,
      leaseId: lease.id,
      period,
      tenantId: lease.tenantId,
      userId: lease.tenant.userId,
      tenantName: lease.tenant.fullName,
      houseNo: lease.unit.houseNo,
      balance,
      dueDate,
    });
    if (delivered) sent += 1;
    else already += 1;
  }
  revalidateBills();
  redirect(billPath(period, undefined, `reminded-${sent}-already-${already}`));
}

export async function issueLeasePeriodAction(formData: FormData) {
  const { orgId } = await requireBillOrg();
  const leaseId = String(formData.get("leaseId") ?? "");
  const period = String(formData.get("period") ?? getCurrentPeriod());
  if (!isBillingPeriod(period) || !leaseId) redirect("/dashboard/org/charges/bills");
  await prisma.$transaction((tx) => ensureLeasePeriodCharges(tx, { orgId, leaseId, period }));
  revalidateBills(leaseId);
  redirect(billPath(period, leaseId, "lease-issued"));
}

export async function addPeriodPenaltyAction(formData: FormData) {
  const { session, orgId } = await requireBillOrg();
  const leaseId = String(formData.get("leaseId") ?? "");
  const period = String(formData.get("period") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? ""));
  if (!isBillingPeriod(period) || !leaseId) redirect("/dashboard/org/charges/bills");
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000 || description.length < 3 || description.length > 240) {
    redirect(billPath(period, leaseId, "penalty-invalid"));
  }
  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, orgId, deletedAt: null, status: "ACTIVE" },
    select: { id: true, dueDay: true },
  });
  if (!lease) redirect("/dashboard/org/charges/bills");
  const due = new Date();
  due.setDate(due.getDate() + 7);
  try {
    const charge = await prisma.rentCharge.create({
      data: {
        orgId,
        leaseId,
        period,
        chargeType: "PENALTY",
        description,
        amountDue: new Prisma.Decimal(amount),
        amountPaid: 0,
        balance: new Prisma.Decimal(amount),
        dueDate: due,
        status: "UNPAID",
      },
      select: { id: true },
    });
    try { await postRentChargeAccrual(prisma, charge.id, session.userId); } catch { /* Accounting can be initialized later. */ }
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      redirect(billPath(period, leaseId, "penalty-exists"));
    }
    throw error;
  }
  revalidateBills(leaseId);
  redirect(billPath(period, leaseId, "penalty-added"));
}

export async function sendPeriodBillReminderAction(formData: FormData) {
  const { session, orgId } = await requireBillOrg();
  const leaseId = String(formData.get("leaseId") ?? "");
  const period = String(formData.get("period") ?? "");
  if (!isBillingPeriod(period) || !leaseId) redirect("/dashboard/org/charges/bills");
  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, orgId, deletedAt: null },
    select: { id: true, tenantId: true, tenant: { select: { userId: true, fullName: true } }, unit: { select: { houseNo: true } } },
  });
  if (!lease) redirect("/dashboard/org/charges/bills");
  const returnTo = String(formData.get("returnTo") ?? "");
  const bill = await getPeriodBillForTenant({ db: prisma, orgId, tenantId: lease.tenantId, period, showPendingWater: true });
  const balance = bill?.balance ?? 0;
  const destination = QUEUE_RETURNS.has(returnTo) ? returnTo : "";
  if (balance <= 0) redirect(destination ? `${destination}?notice=nothing-due` : billPath(period, leaseId, "nothing-due"));
  const delivered = await remindLeasePeriod({
    orgId,
    actorUserId: session.userId,
    leaseId,
    period,
    tenantId: lease.tenantId,
    userId: lease.tenant.userId,
    tenantName: lease.tenant.fullName,
    houseNo: lease.unit.houseNo,
    balance,
    dueDate: bill?.dueDate ?? null,
  });
  revalidateBills(leaseId);
  const notice = delivered ? "reminder-sent" : "reminder-already";
  redirect(destination ? `${destination}?notice=${notice}` : billPath(period, leaseId, notice));
}

export async function verifyBillPaymentAction(formData: FormData) {
  const session = await requirePaymentReviewer();
  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const verificationNote = String(formData.get("verificationNote") ?? "").trim();
  const leaseId = String(formData.get("leaseId") ?? "");
  const period = String(formData.get("period") ?? "");
  if (!paymentId) throw new Error("Payment id is required.");
  if (verificationNote.length < 5 || verificationNote.length > 2000) throw new Error("Record how the payment evidence was verified (5–2,000 characters).");
  if (!isBillingPeriod(period) || !leaseId) redirect("/dashboard/org/charges/bills");
  await prisma.$transaction((tx) => verifyPayment(tx, session, paymentId, verificationNote), { isolationLevel: "Serializable" });
  const receipt = await prisma.receipt.findFirst({ where: { paymentId }, select: { id: true } });
  revalidateBills(leaseId);
  revalidatePath("/dashboard/org/payments");
  revalidatePath("/dashboard/tenant/invoice");
  const params = new URLSearchParams({ period, notice: "payment-verified" });
  if (receipt) params.set("receipt", receipt.id);
  redirect(`/dashboard/org/charges/bills/${leaseId}?${params.toString()}`);
}

export async function recordBillReadingAction(formData: FormData) {
  const { session, orgId } = await requireBillOrg();
  const leaseId = String(formData.get("leaseId") ?? "");
  const period = String(formData.get("period") ?? "");
  const prevRaw = String(formData.get("prevReading") ?? "");
  const currentRaw = String(formData.get("currentReading") ?? "");
  if (!isBillingPeriod(period) || !leaseId) redirect("/dashboard/org/charges/bills");
  if (!/^\d+$/.test(prevRaw) || !/^\d+$/.test(currentRaw)) redirect(billPath(period, leaseId, "reading-invalid"));
  const prevReading = Number(prevRaw);
  const currentReading = Number(currentRaw);
  if (currentReading < prevReading) redirect(billPath(period, leaseId, "reading-invalid"));
  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, orgId, deletedAt: null },
    select: { unitId: true, unit: { select: { property: { select: { waterRatePerUnit: true } } } } },
  });
  if (!lease) redirect("/dashboard/org/charges/bills");
  const priorReadings = await prisma.meterReading.count({ where: { unitId: lease.unitId } });
  if (lease.unit.property.waterRatePerUnit == null && priorReadings === 0) redirect(billPath(period, leaseId, "reading-invalid"));
  try {
    await prisma.meterReading.create({
      data: {
        unitId: lease.unitId,
        period,
        prevReading,
        currentReading,
        unitsUsed: currentReading - prevReading,
        submittedByUserId: session.userId,
        notes: "Entered from the period bill.",
      },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") redirect(billPath(period, leaseId, "reading-exists"));
    throw error;
  }
  revalidateBills(leaseId);
  redirect(billPath(period, leaseId, "reading-saved"));
}

export async function sendBillStkAction(formData: FormData) {
  const { session, orgId } = await requireBillOrg();
  const leaseId = String(formData.get("leaseId") ?? "");
  const period = String(formData.get("period") ?? "");
  if (!isBillingPeriod(period) || !leaseId) redirect("/dashboard/org/charges/bills");
  if (!isMpesaStkConfigured(orgId)) redirect(billPath(period, leaseId, "stk-unconfigured"));
  let phone = "";
  try {
    phone = normalizeMpesaPhone(String(formData.get("phone") ?? ""));
  } catch {
    redirect(billPath(period, leaseId, "stk-phone"));
  }
  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, orgId, deletedAt: null, status: "ACTIVE" },
    select: { tenantId: true, tenant: { select: { id: true, fullName: true, userId: true } } },
  });
  if (!lease) redirect("/dashboard/org/charges/bills");
  const waiting = await prisma.payment.findFirst({
    where: {
      orgId,
      payerTenantId: lease.tenantId,
      method: "MPESA_STK",
      reversedAt: null,
      gatewayStatus: { in: ["INITIATED", "PENDING"] },
      callbackRaw: { path: ["period"], equals: period },
    },
    select: { id: true },
  });
  if (waiting) redirect(billPath(period, leaseId, "stk-waiting"));

  let paymentId: string | null = null;
  try {
    const tokenPromise = getMpesaAccessTokenForOrg(orgId);
    const created = await prisma.$transaction(async (tx) => processPeriodBillPayment({
      tx,
      orgId,
      userId: lease.tenant.userId ?? session.userId,
      tenant: { id: lease.tenant.id, fullName: lease.tenant.fullName },
      paymentMethod: "MPESA_STK",
      checkoutMethod: "mpesa-stk",
      settlementMode: "gateway",
      paidAt: new Date(),
      transactionId: "",
      transactionReferenceKey: null,
      phoneNumber: phone,
      source: "period_bill",
      sourceId: period,
    }, {}));
    paymentId = created.id;
    const accessToken = await tokenPromise;
    const stk = await requestMpesaStkPush({
      orgId,
      amount: Number(created.amount),
      phone,
      accountReference: (created.reference ?? created.id).slice(0, 12),
      transactionDesc: "EstateDesk bill",
      accessToken,
    });
    if (!stk.checkoutRequestId) throw new MpesaRequestError(stk.customerMessage || "M-Pesa did not accept the prompt.", true);
    await prisma.payment.update({
      where: { id: created.id },
      data: {
        checkoutRequestId: stk.checkoutRequestId,
        merchantRequestId: stk.merchantRequestId || null,
        gatewayStatus: "PENDING",
        notes: stk.customerMessage || "STK push sent. Waiting for confirmation.",
      },
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (paymentId) {
      const rejected = error instanceof MpesaRequestError && error.rejected;
      await prisma.payment.updateMany({
        where: { id: paymentId, gatewayStatus: { in: ["INITIATED", "PENDING"] }, checkoutRequestId: null },
        data: {
          gatewayStatus: rejected ? "FAILED" : "INITIATED",
          verificationStatus: rejected ? "REJECTED" : "NOT_REQUIRED",
          notes: rejected ? "M-Pesa rejected the prompt. No payment was confirmed." : "The prompt result is unknown. Check it before sending another.",
        },
      });
    }
    revalidateBills(leaseId);
    const cleared = error instanceof Error && error.message.includes("already cleared");
    redirect(billPath(period, leaseId, cleared ? "nothing-due" : "stk-failed"));
  }
  revalidateBills(leaseId);
  redirect(billPath(period, leaseId, "stk-sent"));
}
