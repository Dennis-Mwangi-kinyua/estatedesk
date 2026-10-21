import { getUserSession } from "@/lib/auth/session";
import { canReadVerifiedInvoice } from "@/lib/documents/invoice-access";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { privatePageMetadata } from "@/lib/seo";
import { publicVerificationSummary } from "@/lib/documents/verification-privacy";
import { readLeaseSnapshot } from "@/lib/documents/lease-snapshot";
import { readReceiptSnapshot } from "@/lib/documents/receipt-snapshot";
import { readInvoiceSnapshot } from "@/lib/documents/invoice-snapshot";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { ...privatePageMetadata, title: "Verify EstateDesk document" };
export default async function VerifyDocumentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const document = await prisma.documentRecord.findUnique({ where: { verificationCode: code }, select: { orgId: true, entityId: true, entityType: true, documentType: true, status: true, expiresAt: true, serialNumber: true, issuedAt: true, contentHash: true, metadata: true } });
  if (!document) notFound();
  const identity = document.documentType === "LEASE" ? readLeaseSnapshot(document.metadata)?.tenantName : document.documentType === "RECEIPT" ? readReceiptSnapshot(document.metadata)?.payerName : readInvoiceSnapshot(document.metadata)?.tenantName;
  const summary = publicVerificationSummary(document, identity);
  const canDownload = summary.valid && await canReadVerifiedInvoice(await getUserSession(), document);
  return <main className="min-h-screen bg-background p-4 sm:p-10"><section className="mx-auto max-w-2xl space-y-5 rounded-2xl border bg-card p-6"><p className="text-sm text-muted-foreground">EstateDesk document registry</p><h1 className="text-2xl font-bold">{summary.valid ? "Document verified" : "Document is not currently valid"}</h1><dl className="grid gap-4 sm:grid-cols-2">{[["Document type", summary.type], ["Status", summary.status], ["Reference", summary.serialNumber], ["Named party", summary.identity], ["Issued", summary.issuedAt.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words font-semibold">{value}</dd></div>)}</dl>{summary.fingerprint ? <p className="break-all text-xs">SHA-256: {summary.fingerprint}</p> : null}<p className="text-sm text-muted-foreground">Public verification confirms the document’s registry status. Full details and downloads require an authorized account.</p>{canDownload ? <a href={`/verify-document/${encodeURIComponent(code)}/download`} className="inline-flex rounded-lg border px-4 py-3 text-sm font-semibold">Download full invoice</a> : null}<Link href="/dashboard" className="inline-flex rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Open your workspace to view documents</Link></section></main>;
}
