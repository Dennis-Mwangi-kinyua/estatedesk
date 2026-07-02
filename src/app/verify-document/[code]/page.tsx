import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Ban, Building2, CalendarDays, FileCheck2, Fingerprint } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { readReceiptSnapshot } from "@/lib/documents/receipt-snapshot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify document",
  description: "Verify the current status and origin of an EstateDesk document.",
  robots: { index: false, follow: false },
};

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
  const valid =
    !expired && ["ISSUED", "COMPLETED"].includes(document.status);

  await prisma.documentEvent.create({
    data: {
      orgId: document.orgId,
      documentId: document.id,
      eventType: "VERIFIED",
      metadata: { result: valid ? "VALID" : "NOT_VALID" },
    },
  });

  const details = [
    { label: "Serial number", value: document.serialNumber, icon: Fingerprint },
    { label: "Document type", value: formatLabel(document.documentType), icon: FileCheck2 },
    { label: "Issued by", value: document.org.name, icon: Building2 },
    { label: "Issued at", value: formatDate(document.issuedAt), icon: CalendarDays },
  ];
  const receipt = document.documentType === "RECEIPT"
    ? readReceiptSnapshot(document.metadata)
    : null;
  const receiptDetails = receipt ? [
    ["Payer", receipt.payerName],
    ["Amount", new Intl.NumberFormat("en-KE", { style: "currency", currency: receipt.currencyCode }).format(receipt.amount)],
    ["Payment reference", receipt.paymentReference ?? "Not supplied"],
    ["Property / unit", [receipt.propertyName, receipt.unitName].filter(Boolean).join(" / ") || "Not linked"],
    ["Payment period", receipt.periods.join(", ") || "Not specified"],
    ["Payment method", formatLabel(receipt.paymentMethod)],
  ] : [];

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10 text-neutral-950 sm:px-6 sm:py-16">
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
                Current registry status: {expired ? "Expired" : formatLabel(document.status)}
              </p>
              {!valid && document.revocationReason ? (
                <p className="mt-2 text-sm leading-6 text-red-700">
                  Reason: {document.revocationReason}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2 mt-6">
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
          {document.contentHash ? (
            <div className="mt-4">
              <p className="text-xs font-medium text-neutral-500">SHA-256 fingerprint</p>
              <code className="mt-1 block break-all rounded-md bg-neutral-100 p-3 text-xs text-neutral-700">
                {document.contentHash}
              </code>
            </div>
          ) : (
            <p className="mt-4 text-xs text-neutral-500">The artifact fingerprint will be registered on first secure download.</p>
          )}
        </section>
      </div>
    </main>
  );
}
