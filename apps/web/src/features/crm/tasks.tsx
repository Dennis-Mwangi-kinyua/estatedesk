import { requireOrgCrmAccess } from "@/features/crm/access";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { tenantCrmWhere, label } from "./policy";
import { CrmShell, Panel, Field, inputClass, dateText } from "./ui";
import { CrmForm, DateField } from "./form";
import { completeCrmActivity, updateCrmTask } from "./actions";
import { activityInclude, pageNumber, platformOwners, orgOwners } from "./queries";

export type TaskParams = { status?: string; mine?: string; page?: string };
export async function CrmTasks({ platform, params }: { platform: boolean; params: TaskParams }) {
  const session = platform ? await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]) : await requireOrgCrmAccess();
  const now = new Date(); const page = pageNumber(params.page); const status = ["open", "overdue", "completed"].includes(params.status ?? "") ? params.status! : "open";
  const scope: Prisma.CrmActivityWhereInput = platform ? { scopeOrgId: null, OR: [{ leadId: { not: null } }, { customerOrg: { deletedAt: null } }] } : { scopeOrgId: session.activeOrgId!, tenant: tenantCrmWhere(session.activeOrgId!, session.membershipScope) };
  const where: Prisma.CrmActivityWhereInput = { ...scope, dueAt: status === "overdue" ? { lt: now } : { not: null }, completedAt: status === "completed" ? { not: null } : null, ...(params.mine === "yes" ? { assigneeId: session.userId } : {}) };
  const [tasks, total, owners] = await Promise.all([prisma.crmActivity.findMany({ where, orderBy: [{ dueAt: "asc" }, { id: "asc" }], skip: (page - 1) * 25, take: 25, include: { ...activityInclude, lead: { select: { companyName: true } }, tenant: { select: { fullName: true } }, customerOrg: { select: { name: true } } } }), prisma.crmActivity.count({ where }), platform ? platformOwners() : orgOwners(session.activeOrgId!)]);
  const base = platform ? "/platform/crm" : "/dashboard/org/crm";
  const href = (next: number) => `${base}/tasks?${new URLSearchParams({ status, mine: params.mine ?? "", page: String(next) })}`;
  return <CrmShell platform={platform} title="CRM tasks" description="Calls, demos, and customer follow-ups in one shared queue.">
    <Panel>
      <form className="flex flex-wrap gap-3">
        <select name="status" aria-label="Task status" defaultValue={status} className={`${inputClass} max-w-xs`}>
          <option value="open">Open follow-ups</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
        </select>
        <select name="mine" aria-label="Task owner" defaultValue={params.mine ?? ""} className={`${inputClass} max-w-xs`}>
          <option value="">Everyone</option>
          <option value="yes">Assigned to me</option>
        </select>
        <button className="rounded-lg border px-4 py-2">Filter</button>
      </form>
    </Panel>
    <Panel>
      <p className="mb-4 text-sm text-muted-foreground">
        {total}{" "}tasks · Dates in East Africa Time</p>
      <ul className="space-y-3">
        {tasks.map(t => {
          const target = t.leadId ? "lead" : t.tenantId ? "tenant" : "organization"; const targetId = t.leadId ?? t.tenantId ?? t.customerOrgId!;
          const url = t.leadId ? `/platform/crm/${targetId}` : t.tenantId ? `/dashboard/org/crm/${targetId}` : `/platform/crm/customers/${targetId}`;
          return <li key={t.id} className="flex flex-col justify-between gap-4 rounded-xl border p-4 md:flex-row">
            <div>
              <Link className="font-semibold underline" href={url}>{t.lead?.companyName ?? t.tenant?.fullName ?? t.customerOrg?.name}</Link>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{t.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {label(t.kind)}{" "}·{" "}{label(t.priority)}{" "}priority ·{" "}{t.assignee?.fullName ?? "Unassigned"}
              </p>
              <p className={`mt-2 text-xs ${!t.completedAt && t.dueAt! < now ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>{t.completedAt ? `Completed ${dateText(t.completedAt)}` : `Due ${dateText(t.dueAt!)}`}</p>
            </div>
            {!t.completedAt && <CrmForm action={completeCrmActivity} submit="Mark complete">
              <input type="hidden" name="target" value={target} />
              <input type="hidden" name="targetId" value={targetId} />
              <input type="hidden" name="activityId" value={t.id} />
            </CrmForm>}
            {!t.completedAt && t.subject !== "Sales demo" && <details className="md:max-w-sm">
              <summary className="cursor-pointer text-sm underline">Edit task</summary>
              <CrmForm action={updateCrmTask} submit="Save task" className="mt-3">
                <input type="hidden" name="target" value={target} />
                <input type="hidden" name="targetId" value={targetId} />
                <input type="hidden" name="activityId" value={t.id} />
                <input type="hidden" name="kind" value={t.kind} />
                <Field title="Task"><textarea name="body" required maxLength={4000} defaultValue={t.body} className={inputClass} /></Field>
                <Field title="Due (East Africa Time)"><DateField name="dueAt" initial={t.dueAt?.toISOString()} /></Field>
                <Field title="Priority"><select name="priority" defaultValue={t.priority} className={inputClass}>{["LOW", "NORMAL", "HIGH", "URGENT"].map(p => <option key={p}>{p}</option>)}</select></Field>
                <Field title="Assigned to">
                  <select name="assigneeId" defaultValue={t.assigneeId ?? ""} className={inputClass}>
                    <option value="">Unassigned</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}
                  </select>
                </Field>
              </CrmForm>
            </details>}
          </li>;
        })}
      </ul>
      {!tasks.length && <p className="py-5 text-sm text-muted-foreground">No tasks match this view. Add a dated follow-up from a customer or prospect record.</p>}
      <div className="mt-5 flex gap-4 text-sm">
        {page > 1 && <Link href={href(page - 1)}>Previous</Link>}
        <span>Page{" "}{page}
        </span>
        {page * 25 < total && <Link href={href(page + 1)}>Next</Link>}
      </div>
    </Panel>
  </CrmShell>;
}
