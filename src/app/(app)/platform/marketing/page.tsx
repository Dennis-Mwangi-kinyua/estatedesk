import { APP_PLANS } from "@/lib/billing/plans";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
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
} from "../_components/control-plane";
import {
  AttributionForm,
  CreateMarketerForm,
  MarketerUpdateForm,
} from "./marketing-forms";

export const dynamic = "force-dynamic";

function toNumber(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function formatPercent(value: unknown) {
  return `${toNumber(value).toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  })}%`;
}

function estimateMonthlyCommission({
  plan,
  rate,
}: {
  plan: keyof typeof APP_PLANS | null | undefined;
  rate: unknown;
}) {
  if (!plan) return 0;
  return (APP_PLANS[plan].monthlyAmount * toNumber(rate)) / 100;
}

export default async function PlatformMarketingPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [marketers, leads, organizations, unassignedLeads, unassignedOrgs] =
    await Promise.all([
      prisma.platformMarketer.findMany({
        orderBy: [{ status: "asc" }, { fullName: "asc" }],
        include: {
          _count: {
            select: {
              onboardingRequests: true,
              organizations: true,
            },
          },
        },
      }),
      prisma.onboardingRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          marketer: {
            select: {
              id: true,
              fullName: true,
              referralCode: true,
            },
          },
        },
      }),
      prisma.organization.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          marketer: {
            select: {
              id: true,
              fullName: true,
              referralCode: true,
            },
          },
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
        },
      }),
      prisma.onboardingRequest.count({ where: { marketerId: null } }),
      prisma.organization.count({ where: { marketerId: null, deletedAt: null } }),
    ]);

  const activeMarketers = marketers.filter(
    (marketer) => marketer.status === "ACTIVE" && marketer.deletedAt === null,
  );
  const marketerOptions = marketers
    .filter((marketer) => marketer.deletedAt === null)
    .map((marketer) => ({
      id: marketer.id,
      fullName:
        marketer.status === "ACTIVE"
          ? marketer.fullName
          : `${marketer.fullName} (inactive)`,
      referralCode: marketer.referralCode,
    }));
  const attributedLeads = leads.filter((lead) => lead.marketerId).length;
  const attributedOrgs = organizations.filter((org) => org.marketerId).length;
  const estimatedMonthlyCommission = organizations.reduce((sum, org) => {
    return (
      sum +
      estimateMonthlyCommission({
        plan: org.subscription?.plan ?? null,
        rate: org.commissionRate,
      })
    );
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Growth"
        title="Marketing attribution"
        description="Track which marketer brought each lead or customer, manage referral codes, and follow commission readiness from the platform side."
      />

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
        description="Create a marketer and give them a referral code. Public forms accept ?ref=CODE or ?referral=CODE."
      >
        <CreateMarketerForm />
      </Surface>

      <Surface title="Marketers">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Marketer</th>
                <th className="px-4 py-3 font-medium">Referral code</th>
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
                <EmptyRow colSpan={7} label="No marketers created yet." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface title="Recent leads">
        <div className="overflow-x-auto">
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
        <div className="overflow-x-auto">
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
    </div>
  );
}
