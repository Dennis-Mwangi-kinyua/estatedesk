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

export function MarketingLeadsOrgsSection(props: MarketingWorkspaceProps) {
  const { leads, organizations, marketerOptions } = props;

  return (
    <>
      <Surface title="Recent leads">
        <div className="grid gap-3 p-3 lg:hidden">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-neutral-950">
                    {lead.companyName}
                  </h3>
                  <p className="mt-1 truncate text-xs text-neutral-500">
                    {lead.fullName} • {lead.workEmail}
                  </p>
                </div>
                <Badge tone={toneForStatus(lead.commissionStatus)}>
                  {lead.commissionStatus}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <InfoTile
                  label="Marketer"
                  value={
                    lead.marketer
                      ? `${lead.marketer.fullName} (${lead.marketer.referralCode})`
                      : lead.referralCode ?? "Unassigned"
                  }
                />
                <InfoTile
                  label="Commission"
                  value={
                    lead.commissionRate ? formatPercent(lead.commissionRate) : "-"
                  }
                />
                <InfoTile label="Created" value={formatDateTime(lead.createdAt)} />
                <InfoTile label="Lead status" value={lead.status} />
              </div>

              <div className="mt-3">
                <AttributionForm
                  kind="lead"
                  hiddenName="requestId"
                  hiddenValue={lead.id}
                  marketers={marketerOptions}
                  selectedMarketerId={lead.marketerId}
                  commissionRate={
                    lead.commissionRate === null ? null : toNumber(lead.commissionRate)
                  }
                  commissionStatus={lead.commissionStatus}
                  commissionNotes={lead.commissionNotes}
                />
              </div>
            </article>
          ))}
          {leads.length === 0 ? (
            <EmptyState label="No onboarding leads found." />
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Marketer</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Update attribution</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-neutral-950">{lead.companyName}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {lead.fullName} • {lead.workEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {lead.marketer ? (
                      <>
                        <p className="font-semibold text-neutral-800">{lead.marketer.fullName}</p>
                        <p className="text-xs text-neutral-500">{lead.marketer.referralCode}</p>
                      </>
                    ) : (
                      lead.referralCode ?? "Unassigned"
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {lead.commissionRate ? formatPercent(lead.commissionRate) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(lead.commissionStatus)}>
                      {lead.commissionStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDateTime(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <AttributionForm
                      kind="lead"
                      hiddenName="requestId"
                      hiddenValue={lead.id}
                      marketers={marketerOptions}
                      selectedMarketerId={lead.marketerId}
                      commissionRate={
                        lead.commissionRate === null ? null : toNumber(lead.commissionRate)
                      }
                      commissionStatus={lead.commissionStatus}
                      commissionNotes={lead.commissionNotes}
                    />
                  </td>
                </tr>
              ))}
              {leads.length === 0 ? (
                <EmptyRow colSpan={6} label="No onboarding leads found." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface title="Recent organizations">
        <div className="grid gap-3 p-3 lg:hidden">
          {organizations.map((org) => {
            const estimated = estimateMonthlyCommission({
              plan: org.subscription?.plan ?? null,
              rate: org.commissionRate,
            });

            return (
              <article
                key={org.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <AdminLink href={`/platform/organizations/${org.slug}`}>
                      {org.name}
                    </AdminLink>
                    <p className="mt-1 truncate text-xs text-neutral-500">
                      /{org.slug}
                    </p>
                  </div>
                  <Badge tone={toneForStatus(org.commissionStatus)}>
                    {org.commissionStatus}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <InfoTile
                    label="Marketer"
                    value={
                      org.marketer
                        ? `${org.marketer.fullName} (${org.marketer.referralCode})`
                        : org.referralCode ?? "Unassigned"
                    }
                  />
                  <InfoTile label="Plan" value={org.subscription?.plan ?? "-"} />
                  <InfoTile
                    label="Rate"
                    value={
                      org.commissionRate ? formatPercent(org.commissionRate) : "-"
                    }
                  />
                  <InfoTile
                    label="Est. monthly"
                    value={formatCurrency(estimated)}
                  />
                </div>

                <div className="mt-3">
                  <AttributionForm
                    kind="organization"
                    hiddenName="orgId"
                    hiddenValue={org.id}
                    marketers={marketerOptions}
                    selectedMarketerId={org.marketerId}
                    commissionRate={
                      org.commissionRate === null ? null : toNumber(org.commissionRate)
                    }
                    commissionStatus={org.commissionStatus}
                    commissionNotes={org.commissionNotes}
                  />
                </div>
              </article>
            );
          })}
          {organizations.length === 0 ? (
            <EmptyState label="No organizations found." />
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Marketer</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Est. monthly</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Update attribution</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => {
                const estimated = estimateMonthlyCommission({
                  plan: org.subscription?.plan ?? null,
                  rate: org.commissionRate,
                });

                return (
                  <tr key={org.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <AdminLink href={`/platform/organizations/${org.slug}`}>
                        {org.name}
                      </AdminLink>
                      <p className="mt-1 text-xs text-neutral-500">/{org.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {org.marketer ? (
                        <>
                          <p className="font-semibold text-neutral-800">{org.marketer.fullName}</p>
                          <p className="text-xs text-neutral-500">{org.marketer.referralCode}</p>
                        </>
                      ) : (
                        org.referralCode ?? "Unassigned"
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {org.subscription?.plan ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {org.commissionRate ? formatPercent(org.commissionRate) : "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-950">
                      {formatCurrency(estimated)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={toneForStatus(org.commissionStatus)}>
                        {org.commissionStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <AttributionForm
                        kind="organization"
                        hiddenName="orgId"
                        hiddenValue={org.id}
                        marketers={marketerOptions}
                        selectedMarketerId={org.marketerId}
                        commissionRate={
                          org.commissionRate === null ? null : toNumber(org.commissionRate)
                        }
                        commissionStatus={org.commissionStatus}
                        commissionNotes={org.commissionNotes}
                      />
                    </td>
                  </tr>
                );
              })}
              {organizations.length === 0 ? (
                <EmptyRow colSpan={7} label="No organizations found." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </>
  );
}
