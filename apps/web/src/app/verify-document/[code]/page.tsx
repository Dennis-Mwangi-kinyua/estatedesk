import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Ban,
  Building2,
  CalendarDays,
  FileCheck2,
  Hash,
} from "lucide-react";
import { InvoiceDocumentDisplay } from "@/components/documents/invoice-document-display";
import { verifiedDocumentDownloadPath } from "@/lib/documents/identity";
import { readLeaseSnapshot } from "@/lib/documents/lease-snapshot";
import { readReceiptSnapshot } from "@/lib/documents/receipt-snapshot";
import { createDocumentVerificationQrDataUrl } from "@/lib/documents/verification-qr";
import {
  isVerifiedDocumentAccessible,
  loadVerifiedPeriodInvoiceByCode,
} from "@/lib/documents/tenant-period-invoice";
import { prisma } from "@/lib/prisma";
import { publicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;

  return publicPageMetadata({
    title: "Verify Document",
    description: "Verify and view an EstateDesk document.",
    path: `/verify-document/${code}`,
  });
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  }).format(value);
}

function ValidityBanner({
  valid,
  statusLabel,
  revocationReason,
}: {
  valid: boolean;
  statusLabel: string;
  revocationReason?: string | null;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 sm:px-5 ${
        valid
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            valid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {valid ? <BadgeCheck className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-sm font-semibold">
            {valid ? "Verified EstateDesk invoice" : "This invoice is not currently valid"}
          </p>
          <p
            className={`mt-1 text-sm ${valid ? "text-emerald-800" : "text-red-800"}`}
          >
            Registry status: {statusLabel}
          </p>
          {!valid && revocationReason ? (
            <p className="mt-2 text-sm">Reason: {revocationReason}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default async function VerifyDocumentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const document = await prisma.documentRecord.findUnique({
    where: { verificationCode: code },
    include: { org: { select: { name: true } } },
  });

  if (!document) notFound();

  const expired = document.expiresAt ? document.expiresAt <= new Date() : false;
  const valid = isVerifiedDocumentAccessible(document);
  const statusLabel = expired ? "Expired" : formatLabel(document.status);

  try {
    await prisma.documentEvent.create({
      data: {
        orgId: document.orgId,
        documentId: document.id,
        eventType: "VERIFIED",
        metadata: { result: valid ? "VALID" : "NOT_VALID" },
      },
    });
  } catch {
    // Verification audit is best-effort — never block public document viewing.
  }

  if (document.documentType === "INVOICE" && document.entityType === "PeriodBill") {
    const invoiceContext = await loadVerifiedPeriodInvoiceByCode(code);
    const verificationQrDataUrl = invoiceContext
      ? await createDocumentVerificationQrDataUrl(invoiceContext.pdfData.verificationUrl)
      : null;

    return (
      <main className="ed-verify-document-page ed-invoice-viewer ed-mobile-first ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden px-3 py-4 sm:px-6 sm:py-10">
        <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 sm:space-y-5">
          <header className="space-y-2">
            <p className="text-sm font-semibold text-slate-600">
              EstateDesk document verification
            </p>
            <ValidityBanner
              valid={valid}
              statusLabel={statusLabel}
              revocationReason={document.revocationReason}
            />
          </header>

          {invoiceContext && verificationQrDataUrl && valid ? (
            <InvoiceDocumentDisplay
              data={invoiceContext.pdfData}
              verificationQrDataUrl={verificationQrDataUrl}
              downloadHref={verifiedDocumentDownloadPath(code)}
              openPdfHref={verifiedDocumentDownloadPath(code, { view: true })}
              verificationNote="This invoice was opened from a verified EstateDesk QR code. You can review the full bill below or download the PDF."
            />
          ) : (
            <section className="ed-invoice-paper rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h1 className="text-lg font-semibold text-slate-900">{document.title}</h1>
              <p className="mt-2 text-sm text-slate-600">
                Serial number: {document.serialNumber}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Issued by {document.org.name} on {formatDate(document.issuedAt)}
              </p>
              {!invoiceContext ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  This invoice is registered with EstateDesk, but the live billing details are
                  temporarily unavailable. Try again shortly or contact the issuing organisation.
                </p>
              ) : null}
            </section>
          )}
        </div>
      </main>
    );
  }

  const details = [
    { label: "Serial number", value: document.serialNumber, icon: Hash },
    { label: "Document type", value: formatLabel(document.documentType), icon: FileCheck2 },
    { label: "Issued by", value: document.org.name, icon: Building2 },
    { label: "Issued at", value: formatDate(document.issuedAt), icon: CalendarDays },
  ];
  const receipt = document.documentType === "RECEIPT"
    ? readReceiptSnapshot(document.metadata)
    : null;
  const lease = document.documentType === "LEASE"
    ? readLeaseSnapshot(document.metadata)
    : null;
  const receiptDetails = receipt ? [
    ["Payer", receipt.payerName],
    ["Amount", new Intl.NumberFormat("en-KE", { style: "currency", currency: receipt.currencyCode }).format(receipt.amount)],
    ["Payment reference", receipt.paymentReference ?? "Not supplied"],
    ["Property / unit", [receipt.propertyName, receipt.unitName].filter(Boolean).join(" / ") || "Not linked"],
    ["Payment period", receipt.periods.join(", ") || "Not specified"],
    ["Payment method", formatLabel(receipt.paymentMethod)],
  ] : [];
  const leaseDetails = lease
    ? [
        ["Tenant", lease.tenantName],
        [
          "Tenant registration",
          lease.tenantBelongsToOrg
            ? `Confirmed with ${lease.organizationName}`
            : "Not currently confirmed",
        ],
        ["Tenant ID", lease.tenantId],
        ["Tenant phone", lease.tenantPhone],
        ["Tenant email", lease.tenantEmail ?? "Not supplied"],
        ["National ID", lease.tenantNationalIdMasked ?? "Not supplied"],
        [
          "Property / unit",
          [lease.propertyName, lease.buildingName, `Unit ${lease.unitName}`]
            .filter(Boolean)
            .join(" / "),
        ],
        ["Lease status", formatLabel(lease.leaseStatus)],
        [
          "Lease period",
          `${new Intl.DateTimeFormat("en-KE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(lease.startDate))}${
            lease.endDate
              ? ` to ${new Intl.DateTimeFormat("en-KE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(lease.endDate))}`
              : " onwards"
          }`,
        ],
        [
          "Monthly rent",
          new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: lease.currencyCode,
            maximumFractionDigits: 0,
          }).format(lease.monthlyRent),
        ],
        [
          "Deposit",
          lease.deposit == null
            ? "Not recorded"
            : new Intl.NumberFormat("en-KE", {
                style: "currency",
                currency: lease.currencyCode,
                maximumFractionDigits: 0,
              }).format(lease.deposit),
        ],
        ["Rent due day", `Day ${lease.dueDay}`],
        ["Contract file", lease.contractFileName],
      ]
    : [];

  return (
    <main className="ed-verify-document-page min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="border-b border-neutral-200 pb-6">
          <p className="text-sm font-semibold text-neutral-500">EstateDesk document verification</p>
          <div className="mt-4 flex items-start gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${valid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {valid ? <BadgeCheck className="h-7 w-7" /> : <Ban className="h-7 w-7" />}
            </span>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                {valid ? "Document is valid" : "Document is not currently valid"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Current registry status: {statusLabel}
              </p>
              {!valid && document.revocationReason ? (
                <p className="mt-2 text-sm leading-6 text-red-700">
                  Reason: {document.revocationReason}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
          {details.map((detail) => {
            const Icon = detail.icon;
            return (
              <div key={detail.label} className="bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                  <Icon className="h-4 w-4" /> {detail.label}
                </div>
                <p className="mt-2 break-words text-sm font-semibold text-neutral-950">{detail.value}</p>
              </div>
            );
          })}
        </section>

        {lease && leaseDetails.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-base font-semibold">Lease details</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Scan results confirm the tenant named on this lease and their
              registration with the issuing organisation.
            </p>
            <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
              {leaseDetails.map(([label, value]) => (
                <div key={label} className="bg-white p-4">
                  <p className="text-xs font-medium text-neutral-500">{label}</p>
                  <p className="mt-2 break-words text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {receipt && receiptDetails.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-base font-semibold">Receipt details</h2>
            <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
              {receiptDetails.map(([label, value]) => (
                <div key={label} className="bg-white p-4">
                  <p className="text-xs font-medium text-neutral-500">{label}</p>
                  <p className="mt-2 break-words text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
            {receipt.allocations.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                {receipt.allocations.map((allocation, index) => (
                  <div key={`${allocation.period}-${index}`} className="flex justify-between gap-4 border-b border-neutral-100 p-3 last:border-b-0">
                    <span className="text-sm text-neutral-600">{allocation.period} · {formatLabel(allocation.description)}</span>
                    <span className="text-sm font-semibold">{new Intl.NumberFormat("en-KE", { style: "currency", currency: receipt.currencyCode }).format(allocation.amount)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="mt-6 border-t border-neutral-200 pt-5">
          <h2 className="text-base font-semibold">{document.title}</h2>
          <p className="mt-2 text-sm text-neutral-600">Version {document.version}</p>
        </section>
      </div>
    </main>
  );
}