import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { invoiceData, appendInvoicePayment, invoiceBalance, SUBSCRIPTION_INVOICE_ENTITY, type SubscriptionInvoiceData, type SubscriptionPayment } from "./invoice-ledger";
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
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${input.orgId}))`;
    const record = await tx.documentRecord.findFirst({where:{id:input.invoiceId,orgId:input.orgId,entityType:SUBSCRIPTION_INVOICE_ENTITY,status:{in:["ISSUED","COMPLETED"]}}});
    if (!record) throw Error("Invoice not found.");
    const data = invoiceData(record.metadata);
    const next = appendInvoicePayment(data,input.payment);
    if (next === data) return;
    const duplicate = await tx.auditLog.findFirst({where:{orgId:input.orgId,action:"SUBSCRIPTION_PAYMENT_RECORDED",metadata:{path:["referenceKey"],equals:input.payment.reference.toLowerCase()}}});
    if (duplicate) throw Error("This payment reference has already been recorded for this organisation.");
    const changed = await tx.documentRecord.updateMany({where:{id:record.id,metadata:{equals:json(data)}},data:{metadata:json(next),status:invoiceBalance(next) === 0 ? "COMPLETED" : "ISSUED"}});
    if (changed.count !== 1) throw Error("Invoice changed. Refresh before recording payment.");
    await tx.auditLog.create({data:{orgId:input.orgId,actorUserId:input.payment.recordedBy,action:"SUBSCRIPTION_PAYMENT_RECORDED",entityType:SUBSCRIPTION_INVOICE_ENTITY,entityId:record.id,metadata:{...input.payment,referenceKey:input.payment.reference.toLowerCase()}}});
  });
}
