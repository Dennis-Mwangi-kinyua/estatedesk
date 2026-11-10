import { requireOrgCrmAccess } from "@/features/crm/access";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { stages, label } from "./policy";
import { loadCrmReport } from "./report-service";
import { CrmShell, Panel, inputClass } from "./ui";

function Bars({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map(r => r.count));
  return <Panel>
    <h2 className="mb-4 font-semibold">{title}</h2>
    <ul className="space-y-4">
      {rows.map(r => <li key={r.name}>
        <div className="mb-1 flex justify-between gap-4 text-sm">
          <span>{r.name}</span>
          <span>{r.count}</span>
        </div>
        <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${r.count / max * 100}%` }} /></div>
      </li>)}
    </ul>
    {!rows.length && <p className="text-sm text-muted-foreground">No data in this period.</p>}
  </Panel>;
}
export async function CrmReports({ platform, days: rawDays }: { platform: boolean; days?: string }) {
  const session = platform ? await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]) : await requireOrgCrmAccess();
  const { days, activities, open, overdue, completed, customers, sales, sources, pipeline, plans, tenants, rentals, won, lost } = await loadCrmReport(session, platform, rawDays);
  return <CrmShell platform={platform} title="CRM reports & analytics" description="Measure customer relationships, sales progress, communication, and follow-up performance.">
    <Panel>
      <form className="flex flex-wrap items-center gap-3">
        <label htmlFor="report-days" className="text-sm">Reporting period</label>
        <select id="report-days" name="days" defaultValue={days} className={`${inputClass} max-w-xs`}>
          {[7, 30, 90, 365].map(d => <option key={d} value={d}>Last{" "}{d}{" "}days</option>)}
        </select>
        <button className="rounded-lg border px-4 py-2">Apply</button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Activity and completion counts use the selected period. Customer totals, open follow-ups, pipeline value, and subscriptions show the current position.</p>
    </Panel>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[["Customers", customers], ["Open follow-ups", open], ["Overdue follow-ups", overdue], ["Completed in period", completed]].map(([k, v]) => <Panel key={k}>
        <p className="text-xs text-muted-foreground">{k}</p>
        <p className="mt-2 text-3xl font-semibold">{v}</p>
      </Panel>)}
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Bars title="Activity by type" rows={activities.map(a => ({ name: label(a.kind), count: a._count }))} />
      {platform ? <>
        <Bars title="Lead cohort by current stage" rows={stages.map(s => ({ name: label(s), count: sales.find(a => a.salesStage === s)?._count ?? 0 }))} />
        <Bars title="Lead sources" rows={sources.map(s => ({ name: label(s.source), count: s._count }))} />
        <Bars title="Customer subscriptions" rows={plans.map(p => ({ name: `${p.plan} · ${p.status}`, count: p._count }))} />
        <Panel>
          <h2 className="font-semibold">Sales outcomes</h2>
          <p className="mt-3 text-3xl font-semibold">{won + lost ? `${Math.round(won / (won + lost) * 100)}%` : "—"}</p>
          <p className="mt-2 text-sm text-muted-foreground">Win rate among won and lost leads created in this period.{" "}{won}{" "}won ·{" "}{lost}{" "}lost.</p>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Expected monthly pipeline</h2>
          {pipeline.map(p => <p key={p.currencyCode} className="mt-3 text-lg">
            {p.currencyCode}{" "}{Number(p._sum.expectedMonthlyValue ?? 0).toLocaleString()}{" "}<span className="text-xs text-muted-foreground">·{" "}{p._count}{" "}open deals</span>
          </p>)}
          <p className="mt-3 text-xs text-muted-foreground">Unweighted estimates across all open deals, grouped by currency. These are sales estimates.</p>
        </Panel>
      </> : <>
        <Bars title="Customer status" rows={tenants.map(t => ({ name: label(t.status), count: t._count }))} />
        <Bars title="Rental lead cohort by current status" rows={rentals.map(r => ({ name: label(r.status), count: r._count }))} />
      </>}
    </div>
  </CrmShell>;
}
