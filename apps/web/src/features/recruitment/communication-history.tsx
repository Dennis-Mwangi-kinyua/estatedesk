import type { RecruitmentCommunication } from "@prisma/client";
import { HiringForm } from "./forms";
import type { HiringScope } from "./scope";
import { label } from "./policy";
import { hiringInput } from "./presentation";
const date = (value: Date) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(value);
export function CommunicationHistory({ messages, scope, jobId, title = "Candidate communications" }: { messages: RecruitmentCommunication[]; scope: HiringScope; jobId: string; title?: string }) {
  return <details className="rounded-xl border border-indigo-200 p-4 dark:border-indigo-800"><summary className="min-h-11 cursor-pointer py-2 font-semibold">{title} ({messages.length})</summary>
    <p className="mb-4 text-xs leading-6 text-muted-foreground">Recent messages. Drafts require your approval. Acceptance by the email provider does not confirm delivery to the candidate’s inbox. Internal review notes are never copied into templates.</p>
    {!messages.length && <p className="text-sm text-muted-foreground">No messages recorded for this applicant.</p>}
    <div className="space-y-4">{messages.map(message => <article key={message.id} className="min-w-0 rounded-xl border border-border p-4">
      <div className="flex flex-wrap justify-between gap-2"><h4 className="text-sm font-semibold">{label(message.kind)}</h4><span className="text-xs font-semibold">{message.status === "ACCEPTED" ? "Accepted by email provider" : label(message.status)}</span></div>
      <p className="mt-2 break-all text-xs text-muted-foreground">To: {message.recipient} · {date(message.createdAt)}</p>
      {message.interviewAt && <p className="mt-3 text-xs font-medium">Appointment: {date(message.interviewAt)} (Nairobi). Change appointments through the applicant review before approving a message.</p>}
      {message.status === "DRAFT" ? <div className="mt-4"><HiringForm scope={scope} operation="approveMessage" id={message.id} jobId={jobId} version={message.updatedAt.toISOString()} button="Approve and queue email"><label className="grid gap-1 text-sm">Email subject<input name="subject" required minLength={3} maxLength={200} defaultValue={message.subject} className={hiringInput} /></label><label className="grid gap-1 text-sm">Candidate message<textarea name="body" required minLength={30} maxLength={8000} rows={9} defaultValue={message.body} className={hiringInput} /></label><p className="text-xs leading-6 text-muted-foreground">Check the recipient, decision, appointment, offer details and hiring contact before approving. An approved interview also schedules its displayed appointment reminder about 24 hours beforehand.</p></HiringForm></div> : <><p className="mt-3 text-sm font-medium">{message.subject}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p></>}
      {message.approvedAt && <p className="mt-3 text-xs text-muted-foreground">Approved {date(message.approvedAt)}</p>}
      {message.status === "QUEUED" && <p className="mt-3 text-xs text-muted-foreground">Scheduled from {date(message.scheduledAt)} · {message.attempts} attempts</p>}
      {message.acceptedAt && <p className="mt-3 text-xs text-muted-foreground">Provider accepted {date(message.acceptedAt)}</p>}
      {message.lastError && <p role="status" className="mt-3 text-xs leading-6 text-amber-800 dark:text-amber-200">{message.lastError}</p>}
      {["DRAFT", "QUEUED", "FAILED"].includes(message.status) && <div className="mt-4"><HiringForm scope={scope} operation="cancelMessage" id={message.id} jobId={jobId} button="Cancel message" /></div>}
    </article>)}</div>
  </details>;
}
