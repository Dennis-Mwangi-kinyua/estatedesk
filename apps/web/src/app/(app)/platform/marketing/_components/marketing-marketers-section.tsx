import {
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatCurrency,
  toneForStatus,
} from "../../_components/control-plane";
import {
  CreateMarketerForm,
  MarketerUpdateForm,
} from "../marketing-forms";
import { formatPercent, toNumber } from "../_lib/helpers";
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
      <div className="order-1">
        <PageHeader
          eyebrow="Growth"
          title="Marketing attribution"
          description="Track which marketer brought each lead or customer, manage referral codes, and follow commission readiness from the platform side."
        />
      </div>

      {degraded ? (
        <div className="order-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          Marketing attribution data could not be loaded because the database
          timed out. The page is still available; refresh once the database
          connection recovers.
        </div>
      ) : null}

      <section className="ed-keep-cols order-3 grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:gap-3 xl:grid-cols-5">
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
        className="order-6 lg:order-4"
      >
        <CreateMarketerForm />
      </Surface>

      <Surface title="Marketers" className="order-7 lg:order-5">
        <div className="grid min-w-0 gap-3 p-3 2xl:hidden">
          {marketers.map((marketer) => (
            <article
              key={marketer.id}
              className="min-w-0 rounded-2xl border border-border bg-muted/20 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold text-foreground">
                    {marketer.fullName}
                  </h3>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {marketer.email ?? marketer.phone ?? "No contact"}
                  </p>
                </div>
                <Badge tone={toneForStatus(marketer.status)}>
                  {marketer.deletedAt ? "ARCHIVED" : marketer.status}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-xs min-[360px]:grid-cols-2 sm:grid-cols-4">
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

        <div className="hidden max-w-full overflow-x-auto 2xl:block">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
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
                <tr key={marketer.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{marketer.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {marketer.email ?? marketer.phone ?? "No contact"}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {marketer.referralCode}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    /register?ref={marketer.referralCode}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatPercent(marketer.defaultCommissionRate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {marketer._count.onboardingRequests}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
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
