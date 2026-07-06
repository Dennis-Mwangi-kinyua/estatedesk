import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatCurrency,
  formatDateTime,
  toneForStatus,
} from "../../_components/control-plane";
import {
  AttributionForm,
  CreateMarketerForm,
  MarketerUpdateForm,
} from "../marketing-forms";
import { estimateMonthlyCommission, formatPercent, toNumber } from "../_lib/helpers";
import type { MarketingWorkspaceProps } from "./marketing-workspace";
import { EmptyState, InfoTile } from "./marketing-ui";

export function MarketingMarketersSection(props: MarketingWorkspaceProps) {
  const {
    degraded,
    marketers,
    activeMarketers,
    attributedLeads,
    attributedOrgs,
    unassignedLeads,
    unassignedOrgs,
    estimatedMonthlyCommission,
  } = props;

  return (
    <>
      <PageHeader
        eyebrow="Growth"
        title="Marketing attribution"
        description="Track which marketer brought each lead or customer, manage referral codes, and follow commission readiness from the platform side."
      />

      {degraded ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Marketing attribution data could not be loaded because the database
          timed out. The page is still available; refresh once the database
          connection recovers.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active marketers" value={activeMarketers.length} />
        <StatCard label="Attributed leads" value={attributedLeads} />
        <StatCard label="Attributed orgs" value={attributedOrgs} note={`${unassignedOrgs} unassigned`} />
        <StatCard label="Unassigned leads" value={unassignedLeads} />
        <StatCard
          label="Est. monthly commission"
          value={formatCurrency(estimatedMonthlyCommission)}
        />
      </section>

      <Surface
        title="Add marketer"
        description="Create a marketer and give them a referral code. Public onboarding and sales forms accept ?ref=CODE, ?referral=CODE, and now let clients type the code manually before submitting."
      >
        <CreateMarketerForm />
      </Surface>

      <Surface title="Marketers">
        <div className="grid gap-3 p-3 lg:hidden">
          {marketers.map((marketer) => (
            <article
              key={marketer.id}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-neutral-950">
                    {marketer.fullName}
                  </h3>
                  <p className="mt-1 truncate text-xs text-neutral-500">
                    {marketer.email ?? marketer.phone ?? "No contact"}
                  </p>
                </div>
                <Badge tone={toneForStatus(marketer.status)}>
                  {marketer.deletedAt ? "ARCHIVED" : marketer.status}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <InfoTile label="Code" value={marketer.referralCode} />
                <InfoTile
                  label="Onboarding"
                  value={`/register?ref=${marketer.referralCode}`}
                />
                <InfoTile
                  label="Rate"
                  value={formatPercent(marketer.defaultCommissionRate)}
                />
                <InfoTile
                  label="Links"
                  value={`${marketer._count.onboardingRequests + marketer._count.organizations}`}
                />
              </div>

              <div className="mt-3">
                <MarketerUpdateForm
                  marketerId={marketer.id}
                  defaultCommissionRate={toNumber(marketer.defaultCommissionRate)}
                  status={marketer.status}
                  notes={marketer.notes ?? ""}
                />
              </div>
            </article>
          ))}
          {marketers.length === 0 ? (
            <EmptyState label="No marketers created yet." />
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Marketer</th>
                <th className="px-4 py-3 font-medium">Referral code</th>
                <th className="px-4 py-3 font-medium">Onboarding link</th>
                <th className="px-4 py-3 font-medium">Default rate</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">Organizations</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {marketers.map((marketer) => (
                <tr key={marketer.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-neutral-950">{marketer.fullName}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {marketer.email ?? marketer.phone ?? "No contact"}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-700">
                    {marketer.referralCode}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                    /register?ref={marketer.referralCode}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatPercent(marketer.defaultCommissionRate)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {marketer._count.onboardingRequests}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {marketer._count.organizations}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(marketer.status)}>
                      {marketer.deletedAt ? "ARCHIVED" : marketer.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <MarketerUpdateForm
                      marketerId={marketer.id}
                      defaultCommissionRate={toNumber(marketer.defaultCommissionRate)}
                      status={marketer.status}
                      notes={marketer.notes ?? ""}
                    />
                  </td>
                </tr>
              ))}
              {marketers.length === 0 ? (
                <EmptyRow colSpan={8} label="No marketers created yet." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </>
  );
}
