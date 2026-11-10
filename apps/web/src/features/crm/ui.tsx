import Link from "next/link";
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { randomUUID } from "node:crypto";
import { CrmForm, DateField } from "./form";
import { addCrmActivity, completeCrmActivity } from "./actions";
import { label } from "./policy";

export const inputClass = "min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base";
export const dateText = (date: Date) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(date);
export function Panel({ children }: { children: ReactNode }) { return <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">{children}</section>; }
export function Field({ title, children }: { title: string; children: ReactNode }) {
  const id = `crm-field-${randomUUID()}`;
  return <div className="space-y-1 text-sm font-medium">
    <label htmlFor={id} className="block">{title}</label>
    {cloneElement(children as ReactElement<{ id?: string }>, { id })}
  </div>;
}
export function CrmShell({ title, description, platform = false, children }: { title: string; description: string; platform?: boolean; children: ReactNode }) {
  return <div className="mx-auto min-w-0 max-w-7xl space-y-5 pb-24 [overflow-wrap:anywhere]">
    <header>
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Customer relationships</p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </header>
    <nav aria-label="CRM" className="flex flex-wrap gap-3 text-sm font-medium">
      {platform ? <>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/platform/demos">Demo requests</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/platform/crm">Sales pipeline</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/platform/crm/customers">Customers</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/platform/crm/tasks">Tasks</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/platform/crm/reports">Reports & analytics</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/platform/messages">Inbox</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/platform/marketing">Marketing & referrals</Link>
      </> : <>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/dashboard/org/crm">Customer directory</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/dashboard/org/vacancy-inquiries">Rental leads</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/dashboard/org/crm/tasks">Tasks</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/dashboard/org/crm/reports">Reports & analytics</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2" href="/dashboard/org/notifications">Communication</Link>
      </>}
    </nav>
    {children}
  </div>;
}
type Activity = { id: string; kind: string; priority?: string; body: string; subject?: string | null; deliveryStatus?: string | null; createdAt: Date; dueAt: Date | null; completedAt: Date | null; author: { fullName: string }; assignee: { fullName: string } | null };
export function ActivityFeed({ target, targetId, activities, owners }: { target: string; targetId: string; activities: Activity[]; owners: { id: string; fullName: string }[] }) {
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
    <Panel>
      <h2 className="mb-4 text-lg font-semibold">Record an interaction or follow-up</h2>
      <CrmForm action={addCrmActivity} submit="Add activity">
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="targetId" value={targetId} />
        <Field title="Activity type"><select name="kind" className={inputClass}>{["NOTE", "CALL", "EMAIL", "DEMO", "TASK"].map(k => <option key={k}>{k}</option>)}</select></Field>
        <Field title="Notes / next action"><textarea name="body" required maxLength={4000} rows={4} className={inputClass} /></Field>
        <Field title="Priority"><select name="priority" defaultValue="NORMAL" className={inputClass}>{["LOW", "NORMAL", "HIGH", "URGENT"].map(p => <option key={p}>{p}</option>)}</select></Field>
        <Field title="Assigned to">
          <select name="assigneeId" className={inputClass}>
            <option value="">Unassigned</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}
          </select>
        </Field>
        <Field title="Due date (East Africa Time)"><DateField name="dueAt" /></Field>
      </CrmForm>
    </Panel>
    <Panel>
      <h2 className="mb-4 text-lg font-semibold">Activity history</h2>
      <p className="mb-4 text-xs text-muted-foreground">Dates shown in East Africa Time. Latest 100 activities.</p>
      {!activities.length && <p className="text-sm text-muted-foreground">No interactions yet. Record the first conversation or next step.</p>}
      <ol className="space-y-3">
        {activities.map(a => <li key={a.id} className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {label(a.kind)}{" "}·{" "}{a.author.fullName}{" "}{a.priority && a.priority !== "NORMAL" ? ` · ${label(a.priority)} priority` : ""}
            </span>
            <span>{dateText(a.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm font-medium">{a.subject}</p>
          {a.deliveryStatus && <p className="mt-1 text-xs text-muted-foreground">Delivery:{" "}{label(a.deliveryStatus)}
          </p>}
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">{a.body}</p>
          {a.assignee && <p className="mt-2 text-xs">Assigned to{" "}{a.assignee.fullName}
          </p>}
          {a.dueAt && <>
            <p className={`my-2 text-xs ${!a.completedAt && a.dueAt < new Date() ? "font-semibold text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>{a.completedAt ? `Completed ${dateText(a.completedAt)}` : `Due ${dateText(a.dueAt)}`}</p>
            {!a.completedAt && <CrmForm action={completeCrmActivity} submit="Mark complete">
              <input type="hidden" name="target" value={target} />
              <input type="hidden" name="targetId" value={targetId} />
              <input type="hidden" name="activityId" value={a.id} />
            </CrmForm>}
          </>}
        </li>)}
      </ol>
    </Panel>
  </div>;
}
