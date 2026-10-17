import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { SUBSCRIPTION_INVOICE_ENTITY, invoiceData } from "@/lib/billing/invoice-ledger";
import { createSubscriptionInvoice } from "@/lib/billing/subscription-invoice";
export async function GET(_request: Request,{params}:{params:Promise<{id:string}>}) {
  await requirePlatformRole(["SUPER_ADMIN","PLATFORM_ADMIN"]);
  const {id} = await params;
  const record = await prisma.documentRecord.findFirst({where:{id,entityType:SUBSCRIPTION_INVOICE_ENTITY}});
  if (!record) return new Response("Invoice not found",{status:404});
  const data = invoiceData(record.metadata);
  const pdf = await createSubscriptionInvoice({reference:record.serialNumber,organisation:data.organisation,plan:data.plan,amount:data.amountMinor / 100,issuedAt:new Date(data.issuedAt),renewalDate:new Date(data.renewalDate),paymentInstructions:data.paymentInstructions});
  return new Response(Buffer.from(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${record.serialNumber.replace(/[^A-Za-z0-9_-]/g,"_")}.pdf"`,"Cache-Control":"private, no-store"}});
}
