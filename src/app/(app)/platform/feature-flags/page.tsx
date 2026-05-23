import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

const featureKeys = [
  "taxes",
  "waterBilling",
  "inspections",
  "tenantPortal",
  "whatsappNotifications",
  "kraIntegration",
  "mpesaPayments",
] as const;

function readFeature(features: unknown, key: string) {
  if (!features || typeof features !== "object" || Array.isArray(features)) return false;
  return Boolean((features as Record<string, unknown>)[key]);
}

export default async function FeatureFlagsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { settings: true, kraIntegration: true },
  });

  const configured = organizations.filter((org) => org.settings?.features).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature flags"
        title="Organization capabilities"
        description="Review per-organization feature configuration and integration availability. This uses OrganizationSettings.features when present."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={organizations.length} />
        <StatCard label="Configured feature sets" value={configured} />
        <StatCard
          label="KRA active"
          value={organizations.filter((org) => org.kraIntegration?.status === "ACTIVE").length}
        />
        <StatCard
          label="Missing settings"
          value={organizations.length - configured}
        />
      </section>

      <Surface title="Feature matrix">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                {featureKeys.map((key) => (
                  <th key={key} className="px-4 py-3 font-medium">{key}</th>
                ))}
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${org.slug}`}>{org.name}</AdminLink>
                    <p className="mt-1 text-xs text-neutral-500">/{org.slug}</p>
                  </td>
                  {featureKeys.map((key) => (
                    <td key={key} className="px-4 py-3">
                      <Badge
                        tone={
                          readFeature(org.settings?.features, key)
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-neutral-200 bg-neutral-50 text-neutral-600"
                        }
                      >
                        {readFeature(org.settings?.features, key) ? "On" : "Off"}
                      </Badge>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDateTime(org.settings?.updatedAt)}
                  </td>
                </tr>
              ))}
              {organizations.length === 0 ? (
                <EmptyRow colSpan={featureKeys.length + 2} label="No organizations found." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
