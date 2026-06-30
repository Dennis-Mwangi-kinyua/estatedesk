import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Droplets,
  Gauge,
  Lightbulb,
  RefreshCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { getSmartOrgInsights } from "@/features/insights/server/get-smart-org-insights";
import type {
  InsightDomain,
  InsightSeverity,
} from "@/features/insights/lib/smart-insights";
import { formatLedgerCurrency } from "@/lib/ledger";
import { requireManagementAccess } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

const domainMeta: Record<
  InsightDomain,
  { label: string; icon: typeof Banknote }
> = {
  COLLECTIONS: { label: "Collections", icon: Banknote },
  RECONCILIATION: { label: "Reconciliation", icon: ShieldCheck },
  OCCUPANCY: { label: "Occupancy", icon: Building2 },
  MAINTENANCE: { label: "Maintenance", icon: Wrench },
  LEASES: { label: "Leases", icon: RefreshCcw },
  WATER: { label: "Water", icon: Droplets },
};

const severityClasses: Record<InsightSeverity, string> = {
  CRITICAL: "border-red-200 bg-red-50 text-red-800",
  HIGH: "border-amber-200 bg-amber-50 text-amber-800",
  MEDIUM: "border-sky-200 bg-sky-50 text-sky-800",
  LOW: "border-neutral-200 bg-neutral-50 text-neutral-700",
};

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-red-700";
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-600" : score >= 60 ? "bg-amber-500" : "bg-red-600";
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

export default async function SmartInsightsPage() {
  const session = await requireManagementAccess();
  const insights = await getSmartOrgInsights(session.activeOrgId!);
  const { snapshot } = insights;

  return (
    <div className="space-y-6 p-1 sm:p-2">
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-500">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            Smart operations
          </div>
          <h1 className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">
            Insights and recommendations
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
            Ranked operational actions from live portfolio, ledger, payment, lease,
            maintenance, and water data for {insights.period}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <BadgeCheck className="h-4 w-4 text-emerald-600" />
          Live operational signals
        </div>
      </header>

      <section className="grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <Gauge className="h-4 w-4" /> Portfolio score
          </div>
          <p className={`mt-3 text-3xl font-bold ${scoreTone(insights.score)}`}>
            {insights.score}<span className="text-base font-medium text-neutral-400">/100</span>
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Collection rate</p>
          <p className={`mt-3 text-3xl font-bold ${scoreTone(insights.collectionRate)}`}>
            {insights.collectionRate}%
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {formatLedgerCurrency(snapshot.collections.deficit)} outstanding
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Occupancy</p>
          <p className={`mt-3 text-3xl font-bold ${scoreTone(insights.occupancyRate)}`}>
            {insights.occupancyRate}%
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {snapshot.occupancy.vacantUnits} vacant unit{snapshot.occupancy.vacantUnits === 1 ? "" : "s"}
          </p>
        </div>
        <div className="bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <AlertTriangle className="h-4 w-4" /> Priority actions
          </div>
          <p className="mt-3 text-3xl font-bold text-neutral-950">
            {insights.attentionCount}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Critical or high priority</p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">Recommended next actions</h2>
            <p className="mt-1 text-sm text-neutral-500">Highest impact work appears first.</p>
          </div>
          <span className="text-xs font-medium text-neutral-500">
            {insights.recommendations.length} recommendation{insights.recommendations.length === 1 ? "" : "s"}
          </span>
        </div>

        {insights.recommendations.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {insights.recommendations.map((recommendation) => {
              const meta = domainMeta[recommendation.domain];
              const Icon = meta.icon;
              return (
                <article key={recommendation.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-neutral-500">
                      <Icon className="h-4 w-4 shrink-0" />
                      {meta.label}
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${severityClasses[recommendation.severity]}`}>
                      {recommendation.severity.toLowerCase()}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-neutral-950">{recommendation.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">{recommendation.summary}</p>
                  <div className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-neutral-500">Evidence: {recommendation.evidence}</p>
                    <Link href={recommendation.href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-neutral-900 hover:text-emerald-700">
                      {recommendation.actionLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            No material exceptions detected. The portfolio is operating within the current rules.
          </div>
        )}
      </section>

      <section className="border-t border-neutral-200 pt-5">
        <h2 className="text-lg font-semibold text-neutral-950">Domain health</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(Object.entries(insights.domainScores) as [InsightDomain, number][]).map(([domain, score]) => {
            const meta = domainMeta[domain];
            const Icon = meta.icon;
            return (
              <div key={domain} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <Icon className="h-4 w-4" /> {meta.label}
                  </div>
                  <span className={`text-sm font-bold ${scoreTone(score)}`}>{score}</span>
                </div>
                <div className="mt-3"><ScoreBar score={score} /></div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
