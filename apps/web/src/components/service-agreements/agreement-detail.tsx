import { notFound } from "next/navigation";
import { accessibleAgreement } from "@/lib/service-agreements/service";
import { changeAgreementAction } from "@/lib/service-agreements/actions";
import { Badge, PageHeader, Surface, formatDateTime } from "@/app/(app)/platform/_components/control-plane";

export async function AgreementDetail({ id, platformView, error, ok }: { id: string; platformView: boolean; error?: string; ok?: string }) {
  const access = await accessibleAgreement(id);
  if (!access || (platformView && !access.platform)) notFound();
  const { document, data, platform, session } = access;
  const canSign = platformView ? document.status === "DRAFT" : !platform && document.status === "ISSUED";
  return <div className="engineering-workspace mx-auto min-w-0 w-full max-w-7xl space-y-6">
    <PageHeader eyebrow={document.org.name} title="Service agreement & data processing" description={`Prepared by ${data.representative}. ${document.serialNumber}`} action={<a href={`/api/service-agreements/${id}`} className="rounded-xl border px-4 py-3 text-sm font-semibold">Download PDF</a>} />
    {error ? <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">Unable to save. Reload the agreement, verify your account name and consent, and ensure the document has not already been signed. Draft edits require 500–60,000 characters. Sending requires an active organization administrator.</p> : null}
    {ok ? <p role="status" className="rounded-xl border p-4 text-sm">Agreement saved. Signatures and delivery records are shown below.</p> : null}
    <div className="flex flex-wrap items-center gap-3"><Badge>{document.status === "ISSUED" ? "AWAITING ORGANIZATION SIGNATURE" : document.status}</Badge><span className="text-sm text-muted-foreground">Template {data.templateVersion}</span></div>
    <Surface title="Agreement text" description="Review the complete text and schedules before signing. Signed text cannot be edited.">
      <div className="space-y-6 p-5 text-sm leading-7">{data.body.split("\n\n").map((paragraph, index) => <p key={index} className="whitespace-pre-wrap">{paragraph}</p>)}</div>
    </Surface>
    <div className="engineering-panels grid gap-5">{[["EstateDesk signature", data.platformSignature], ["Organization signature", data.organizationSignature]].map(([label, signature]) => <Surface key={String(label)} title={String(label)}><div className="space-y-2 p-5 text-sm">{signature && typeof signature !== "string" ? <><p className="font-semibold">{signature.name}</p><p>{formatDateTime(new Date(signature.signedAt))}</p><p className="text-xs text-muted-foreground">Authenticated electronic signature; recorded consent to this document.</p></> : <p className="text-muted-foreground">Not signed</p>}</div></Surface>)}</div>
    {canSign ? <Surface title={platformView ? "Sign and send to organization" : "Countersign for your organization"} description="Your signature applies to the exact agreement text shown above.">
      <form action={changeAgreementAction.bind(null, id)} className="space-y-4 p-5">
        <input type="hidden" name="command" value={platformView ? "platform-sign" : "org-sign"} /><input type="hidden" name="contentHash" value={document.contentHash ?? ""} />
        <label className="block space-y-2 text-sm"><span>Your full account name: {session.fullName}</span><input name="name" required maxLength={160} autoComplete="name" className="w-full rounded-xl border p-3" /></label>
        <label className="flex items-start gap-3 text-sm leading-6"><input name="consent" type="checkbox" required className="mt-1 shrink-0" /><span>I have read this agreement, agree to its terms, consent to signing electronically, and confirm I am authorized to bind {platformView ? "Afrisilicon Technology Limited (EstateDesk)" : document.org.name}.</span></label>
        <button className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{platformView ? "Sign and send agreement" : "Sign agreement for organization"}</button>
      </form>
    </Surface> : null}
    {platformView && document.status === "DRAFT" ? <Surface title="Revise unsigned draft" description="Confirm customer-specific schedules and legal terms before signing. Saving changes replaces the draft's content hash."><form action={changeAgreementAction.bind(null, id)} className="space-y-4 p-5"><input type="hidden" name="command" value="edit" /><input type="hidden" name="contentHash" value={document.contentHash ?? ""} /><label className="block space-y-2 text-sm"><span>Complete agreement text</span><textarea name="body" defaultValue={data.body} required minLength={500} maxLength={60000} rows={16} className="w-full rounded-xl border p-3 font-mono text-xs leading-6" /></label><button className="rounded-xl border px-5 py-3 text-sm font-semibold">Save draft revision</button></form></Surface> : null}
    <Surface title="Document history" description={`SHA-256 of the agreement text: ${document.contentHash}`}><ol className="engineering-record-grid">{document.events.map(event => <li key={event.id}><p className="text-sm font-semibold">{event.eventType.replaceAll("_", " ")}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p></li>)}</ol></Surface>
  </div>;
}
