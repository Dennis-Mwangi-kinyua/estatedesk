import { notFound } from "next/navigation";
import { isPayableWaterBillStatus } from "@/lib/water-bills/status";
import { loadTenantPeriodInvoice } from "@/lib/documents/tenant-period-invoice";
import { createDocumentVerificationQrDataUrl } from "@/lib/documents/verification-qr";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { InvoiceDocumentView } from "./_components/invoice-document-view";

export const dynamic = "force-dynamic";

export default async function TenantInvoiceViewPage({
  params,
}: {
  params: Promise<{ period: string }>;
}) {
  const { period } = await params;
  const session = await requireTenantAccess();

  if (!session.userId || !session.activeOrgId) {
    notFound();
  }

  const context = await loadTenantPeriodInvoice(
    session.userId,
    session.activeOrgId,
    period,
  );

  if (!context) {
    notFound();
  }

  const { pdfData, periodBill, waterBillStatus } = context;
  const verificationQrDataUrl = await createDocumentVerificationQrDataUrl(
    pdfData.verificationUrl,
  );
  const waterLine = pdfData.lines.find((line) => line.waterReading);
  const canPayCombined = periodBill.balance > 0;
  const canPayWaterOnly =
    Boolean(waterLine && waterLine.balance > 0 && periodBill.waterBillId) &&
    Boolean(waterBillStatus && isPayableWaterBillStatus(waterBillStatus));

  return (
    <InvoiceDocumentView
      data={pdfData}
      period={period}
      verificationQrDataUrl={verificationQrDataUrl}
      payNowHref={
        canPayCombined
          ? `/dashboard/tenant/payments/new?source=period_bill&id=${period}`
          : null
      }
      payWaterHref={
        canPayWaterOnly && periodBill.waterBillId
          ? `/dashboard/tenant/payments/new?source=water_bill&id=${periodBill.waterBillId}`
          : null
      }
    />
  );
}