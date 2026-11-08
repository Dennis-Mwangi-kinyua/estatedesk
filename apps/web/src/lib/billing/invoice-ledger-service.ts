import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { invoiceData, appendInvoicePayment, invoiceBalance, SUBSCRIPTION_INVOICE_ENTITY, type SubscriptionInvoiceData, type SubscriptionPayment } from "./invoice-ledger";
import { lockOrgQuota } from "./access";
import { renewedSubscriptionPeriod } from "./subscription-invoice";
const json = (value: SubscriptionInvoiceData) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
export async function saveSubscriptionInvoice(input: {orgId: string; actorUserId: string; reference: string; data: SubscriptionInvoiceData}) {
  return prisma.$transaction(async tx => {
    // One invoice per subscription period; repeated downloads preserve the issued snapshot.
    const record = await tx.documentRecord.upsert({where:{serialNumber:input.reference},update:{},create:{
      orgId:input.orgId,entityType:SUBSCRIPTION_INVOICE_ENTITY,entityId:input.reference,documentType:"INVOICE",status:"ISSUED",title:`Subscription invoice ${input.reference}`,
      serialNumber:input.reference,verificationCode:randomUUID(),issuedByUserId:input.actorUserId,metadata:json(invoiceData(input.data)),
      events:{create:{orgId:input.orgId,actorUserId:input.actorUserId,eventType:"CREATED"}},
    }});
    if (record.orgId !== input.orgId || record.entityType !== SUBSCRIPTION_INVOICE_ENTITY) throw Error("Invoice reference conflict.");
    return {record,data:invoiceData(record.metadata)};
  });
}
export async function recordSubscriptionPayment(input: {invoiceId:string; orgId:string; payment:SubscriptionPayment}) {
  return prisma.$transaction(async tx=>{
    // Serializes reference checks and balance updates across all invoices in this organisation.
    await lockOrgQuota(tx, input.orgId);
    const record = await tx.documentRecord.findFirst({where:{id:input.invoiceId,orgId:input.orgId,entityType:SUBSCRIPTION_INVOICE_ENTITY,status:{in:["ISSUED","COMPLETED"]}}});
    if (!record) throw Error("Invoice not found.");
    const data = invoiceData(record.metadata);
    const appended = appendInvoicePayment(data,input.payment);
    if (appended === data) return { paid: invoiceBalance(data) === 0, renewedUntil: data.renewedUntil };
    const next = { ...appended, payments: appended.payments.map(payment => payment.id === input.payment.id ? { ...payment, receiptNumber: `${record.serialNumber}-R${appended.payments.length}` } : payment) };
    const duplicate = await tx.auditLog.findFirst({where:{orgId:input.orgId,action:"SUBSCRIPTION_PAYMENT_RECORDED",metadata:{path:["referenceKey"],equals:input.payment.reference.toLowerCase()}}});
    if (duplicate) throw Error("This payment reference has already been recorded for this organisation.");
    const now = new Date();
    if (invoiceBalance(next) === 0 && !data.renewedAt) {
      const subscription = await tx.subscription.findUniqueOrThrow({ where: { orgId: input.orgId } });
      const period = renewedSubscriptionPeriod(subscription.currentPeriodEnd, now);
      await tx.subscription.update({ where: { id: subscription.id }, data: { ...period, status: "ACTIVE", cancelledAt: null, cancelAt: null, trialEndsAt: null } });
      next.renewedAt = now.toISOString();
      next.renewedUntil = period.currentPeriodEnd.toISOString();
    }
    const changed = await tx.documentRecord.updateMany({where:{id:record.id,metadata:{equals:json(data)}},data:{metadata:json(next),status:invoiceBalance(next) === 0 ? "COMPLETED" : "ISSUED"}});
    if (changed.count !== 1) throw Error("Invoice changed. Refresh before recording payment.");
    const recipients = await tx.membership.findMany({ where: { orgId: input.orgId, role: { in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"] }, deactivatedAt: null, employmentEndedAt: null, user: { deletedAt: null } }, select: { userId: true } });
    await tx.notification.createMany({ data: [...new Set(recipients.map(row => row.userId))].map(userId => ({ orgId: input.orgId, userId, channel: "IN_APP" as const, type: "GENERAL" as const, status: "SENT" as const, sentAt: now, title: "Subscription payment confirmed", message: `Payment ${input.payment.reference} confirmed. Receipt issued.${next.renewedUntil ? ` Subscription renewed until ${new Date(next.renewedUntil).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })}.` : " A balance remains before renewal."}`, providerResponse: { actionUrl: "/dashboard/org/subscription" } })) });
    await tx.auditLog.create({data:{orgId:input.orgId,actorUserId:input.payment.recordedBy,action:"SUBSCRIPTION_PAYMENT_RECORDED",entityType:SUBSCRIPTION_INVOICE_ENTITY,entityId:record.id,metadata:{...input.payment,referenceKey:input.payment.reference.toLowerCase()}}});
    return { paid: invoiceBalance(next) === 0, renewedUntil: next.renewedUntil };
  });
}

export async function acknowledgeSubscriptionPayment(input: { orgId: string; invoiceId: string; paymentId: string; userId: string }) {
  return prisma.$transaction(async tx => {
    await lockOrgQuota(tx, input.orgId);
    const record = await tx.documentRecord.findFirst({ where: { id: input.invoiceId, orgId: input.orgId, entityType: SUBSCRIPTION_INVOICE_ENTITY, status: { in: ["ISSUED", "COMPLETED"] } } });
    if (!record) throw Error("Invoice not found.");
    const data = invoiceData(record.metadata);
    const payment = data.payments.find(row => row.id === input.paymentId);
    if (!payment) throw Error("Payment not found.");
    if (payment.acknowledgedAt) return;
    const now = new Date().toISOString();
    const next = { ...data, payments: data.payments.map(row => row.id === payment.id ? { ...row, acknowledgedAt: now, acknowledgedBy: input.userId } : row) };
    await tx.documentRecord.update({ where: { id: record.id }, data: { metadata: json(next) } });
    await tx.auditLog.create({ data: { orgId: input.orgId, actorUserId: input.userId, action: "SUBSCRIPTION_PAYMENT_ACKNOWLEDGED", entityType: SUBSCRIPTION_INVOICE_ENTITY, entityId: record.id, metadata: { paymentId: payment.id } } });
  });
}
