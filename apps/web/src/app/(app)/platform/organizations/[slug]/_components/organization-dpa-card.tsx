import Link from "@/components/navigation/workspace-link";
import { ArrowUpRight, FileCheck2, FileText, Plus } from "lucide-react";
import { agreementListHref } from "@/lib/service-agreements/listing";
import { formatDateTime } from "../../../_components/control-plane";
import { OrgSurface } from "./org-detail-ui";

type AgreementSummary = { id: string; status: "DRAFT" | "ISSUED" | "COMPLETED" | "SUPERSEDED" | "REVOKED" | "EXPIRED"; serialNumber: string; createdAt: Date };
export function OrganizationDpaCard({ organizationId, agreement }: { organizationId: string; agreement?: AgreementSummary | null }) {
  const allHref = agreementListHref("all", { orgId: organizationId });
  const newHref = `/platform/agreements/new?orgId=${encodeURIComponent(organizationId)}`;
  const signed = agreement?.status === "COMPLETED";
  const label = signed ? "Signed by both parties" : agreement?.status === "ISSUED" ? "Awaiting signatures" : agreement ? "Draft · not sent" : "No current agreement";
  return <OrgSurface id="organisation-agreement" title="Data processing agreement (DPA)" description="Review this organization’s service terms, data-processing responsibilities, signatures, and verification record.">
    <div className="space-y-4 p-4 sm:p-5">
      <Link href={agreement ? `/platform/agreements/${agreement.id}` : newHref} className="group flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-4 transition hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-row sm:items-center sm:p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary">{signed ? <FileCheck2 className="size-6" aria-hidden="true" /> : <FileText className="size-6" aria-hidden="true" />}</span>
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><h3 className="mt-1 text-base font-semibold">{agreement ? "View DPA agreement" : "Prepare a DPA for this organization"}</h3>{agreement ? <><p className="mt-2 break-all text-xs text-muted-foreground">{agreement.serialNumber}</p><p className="mt-1 text-xs text-muted-foreground">Created {formatDateTime(agreement.createdAt)}</p></> : <p className="mt-2 text-sm leading-6 text-muted-foreground">Create an unsigned draft with this organization already selected, then review it before requesting signatures.</p>}</div>
        <ArrowUpRight className="size-5 shrink-0 text-primary transition group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
      <div className="flex flex-wrap gap-3">
        {signed ? <a href={`/api/service-agreements/${agreement.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><FileCheck2 className="size-4" aria-hidden="true" />Download signed DPA</a> : null}
        <Link href={allHref} className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">View all organization agreements</Link>
        {agreement ? <Link href={newHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold"><Plus className="size-4" aria-hidden="true" />New agreement</Link> : null}
      </div>
    </div>
  </OrgSurface>;
}
