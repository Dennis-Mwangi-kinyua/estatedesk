import { InvoiceDocumentDisplay } from "@/components/documents/invoice-document-display";
import type { InvoicePdfData } from "@/lib/documents/invoice-pdf";
import { tenantInvoiceDownloadPath } from "../../../_lib/paths";

type InvoiceDocumentViewProps = {
  data: InvoicePdfData;
  period: string;
  leaseId?: string;
  verificationQrDataUrl: string;
  payNowHref: string | null;
  payWaterHref: string | null;
};

export function InvoiceDocumentView({
  data,
  period,
  leaseId,
  verificationQrDataUrl,
  payNowHref,
  payWaterHref,
}: InvoiceDocumentViewProps) {
  return (
    <div className="ed-invoice-viewer ed-mobile-first -mx-3 -my-3 min-w-0 w-auto px-3 py-5 sm:-mx-5 sm:-my-4 sm:px-6 sm:py-8 lg:-mx-8 lg:px-10">
      <InvoiceDocumentDisplay
        data={data}
        verificationQrDataUrl={verificationQrDataUrl}
        downloadHref={tenantInvoiceDownloadPath(period, { leaseId })}
        openPdfHref={tenantInvoiceDownloadPath(period, { view: true, leaseId })}
        backLink={{ href: leaseId ? "/dashboard/tenant/invoice/archive" : "/dashboard/tenant/invoice", label: leaseId ? "Back to invoice archive" : "Back to bills" }}
        payNowHref={payNowHref}
        payWaterHref={payWaterHref}
      />
    </div>
  );
}