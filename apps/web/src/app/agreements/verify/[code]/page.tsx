import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { accessibleAgreementByVerificationCode } from "@/lib/service-agreements/service";
import { agreementIntegrity } from "@/lib/service-agreements/verification";
import { privatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { ...privatePageMetadata, title: "Verify service agreement and DPA" };

export default async function VerifyAgreementPage({ params, searchParams }: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ hash?: string }>;
}) {
  const access = await accessibleAgreementByVerificationCode((await params).code);
  if (!access) notFound();
  const { document, data } = access;
  const expectedHash = (await searchParams).hash;
  const integrity = agreementIntegrity(data, document.contentHash) && (!expectedHash || expectedHash === document.contentHash);
  const completed = document.status === "COMPLETED" && !!data.platformSignature && !!data.organizationSignature;
  const valid = integrity && completed;
  return <main className="min-h-dvh bg-background px-4 py-10 text-foreground sm:py-16"><section className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-8">
    <p className="text-sm font-semibold text-muted-foreground">EstateDesk · Agreement verification</p>
    <h1 className="text-2xl font-bold">{valid ? "Verified signed agreement" : !integrity ? "Agreement integrity check failed" : "Agreement is not fully signed"}</h1>
    <p className="text-sm text-muted-foreground">This page checks the registered agreement text and signature records. A QR code alone does not prove that every part of a paper copy or PDF is unchanged. Compare it with the registered download.</p>
    <dl className="space-y-4 text-sm">
      <div><dt className="text-muted-foreground">Organization</dt><dd className="font-semibold">{document.org.name}</dd></div>
      <div><dt className="text-muted-foreground">Document number</dt><dd className="break-all font-semibold">{document.serialNumber}</dd></div>
      <div><dt className="text-muted-foreground">Registry status</dt><dd>{document.status.replaceAll("_", " ")}</dd></div>
      <div><dt className="text-muted-foreground">Template version</dt><dd>{data.templateVersion}</dd></div>
      <div><dt className="text-muted-foreground">Agreement text SHA-256</dt><dd className="break-all font-mono text-xs">{document.contentHash}</dd></div>
      {[['Organization', data.organizationSignature], ['EstateDesk', data.platformSignature]].map(([party, signature]) => <div key={String(party)}><dt className="text-muted-foreground">{String(party)} signature</dt><dd>{signature && typeof signature !== 'string' ? `${signature.name} · ${new Intl.DateTimeFormat('en-KE', {dateStyle:'medium', timeStyle:'short', timeZone:'Africa/Nairobi'}).format(new Date(signature.signedAt))} (EAT)` : 'Not signed'}</dd></div>)}
    </dl>
    <div className="flex flex-wrap gap-3">{valid ? <a href={`/api/service-agreements/${document.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Download registered agreement</a> : null}<Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold">Return to workspace</Link></div>
  </section></main>;
}
