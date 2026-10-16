import Link from "@/components/navigation/workspace-link";
import { ArrowUpRight, Building2, FileText } from "lucide-react";
import type { DocumentStatus } from "@prisma/client";
import { agreementStatusLabel } from "@/lib/service-agreements/listing";

export type AgreementCardRecord = {
  id: string; organization: string; serialNumber: string; status: DocumentStatus;
  createdAt: string; updatedAt: string; organizationSigned: boolean; platformSigned: boolean;
  templateVersion: string; cancellationReason: string | null;
};
const date = (value: string) => new Intl.DateTimeFormat("en-KE", {day:"numeric",month:"short",year:"numeric",timeZone:"Africa/Nairobi"}).format(new Date(value));
export function AgreementCard({ agreement }: {agreement: AgreementCardRecord}) {
  const cancelled = agreement.status === "REVOKED";
  const inactive = ["REVOKED", "EXPIRED", "SUPERSEDED"].includes(agreement.status);
  const completed = agreement.status === "COMPLETED";
  const tone = cancelled ? "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200" : completed ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
  return <Link href={`/platform/agreements/${agreement.id}`} className="group flex h-full min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
    <div className="flex items-start justify-between gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50"><FileText className="size-5" aria-hidden="true" /></span><span className={`max-w-full rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${tone}`}>{agreementStatusLabel(agreement.status,agreement.organizationSigned)}</span></div>
    <div className="min-w-0"><p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="size-3.5 shrink-0" aria-hidden="true" />Organization</p><h3 className="break-words text-lg font-semibold leading-6">{agreement.organization}</h3><p className="mt-1 text-sm text-muted-foreground">Service agreement &amp; DPA</p></div>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4 text-sm">
      <div><dt className="text-xs text-muted-foreground">Organization signature</dt><dd className="mt-1 font-medium">{agreement.organizationSigned ? "Signed" : inactive ? "Not signed" : agreement.status === "DRAFT" ? "Not requested" : "Pending"}</dd></div>
      <div><dt className="text-xs text-muted-foreground">EstateDesk signature</dt><dd className="mt-1 font-medium">{agreement.platformSigned ? "Signed" : inactive ? "Not signed" : agreement.status === "DRAFT" ? "Not requested" : "Pending"}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1">{date(agreement.createdAt)}</dd></div><div><dt className="text-xs text-muted-foreground">Last updated</dt><dd className="mt-1">{date(agreement.updatedAt)}</dd></div>
    </dl>
    <div className="space-y-2 text-xs"><p className="break-all text-muted-foreground"><span className="font-medium text-foreground">Document number:</span> {agreement.serialNumber}</p><p className="text-muted-foreground">Template {agreement.templateVersion}</p>{cancelled && agreement.cancellationReason ? <p className="line-clamp-3 break-words text-red-700 dark:text-red-200"><span className="font-semibold">Cancellation reason:</span> {agreement.cancellationReason}</p> : null}</div>
    <span className="mt-auto flex items-center justify-between gap-3 pt-2 text-sm font-semibold text-primary">{completed ? "Open signed agreement" : cancelled ? "View cancelled agreement" : "Review agreement"}<ArrowUpRight className="size-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
  </Link>;
}
