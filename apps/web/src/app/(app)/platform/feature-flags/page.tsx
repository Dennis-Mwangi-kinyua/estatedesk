import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPlatformControl } from "@/lib/platform/control";
import { applyGlobalFeatureOverrides } from "@/lib/org/features";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
} from "../_components/control-plane";
import { PLATFORM_FEATURE_FLAG_KEYS } from "../_lib/nav";
import { toggleOrganizationFeatureFlagAction } from "./actions";

export const dynamic = "force-dynamic";

function readFeature(features: Record<string, boolean>, key: string) {
  return Boolean(features[key]);
}

export default async function FeatureFlagsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const control = await getPlatformControl();
  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { settings: true, kraIntegration: true },
  });

  const configured = organizations.filter((org) => org.settings?.features).length;
  const globalOverrideCount = Object.keys(control.globalFeatures).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Developer portal"
        title="Feature flags"
        description="Toggle per-organization capabilities. Global overrides from Website Control win at read time and are highlighted below."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={organizations.length} />
        <StatCard label="Configured feature sets" value={configured} />
        <StatCard label="Global overrides" value={globalOverrideCount} />
        <StatCard
          label="KRA active"
          value={organizations.filter((org) => org.kraIntegration?.status === "ACTIVE").length}
        />
      </section>

      {globalOverrideCount > 0 ? (
        <Surface
          title="Active global overrides"
          description="These platform-wide forces replace org values at read time. Manage them in Website Control."
        >
          <div className="flex flex-wrap gap-2 p-4">
            {Object.entries(control.globalFeatures).map(([key, value]) => (
              <Badge
                key={key}
                tone={
                  value
                    ? "border-violet-300 bg-violet-50 text-violet-900"
                    : "border-red-200 bg-red-50 text-red-800"
                }
              >
                {key}: {value ? "FORCE ON" : "FORCE OFF"}
              </Badge>
            ))}
          </div>
        </Surface>
      ) : null}

      <Surface
        title="Feature matrix"
        description="Click a flag badge to toggle org storage. Values shown include global overrides."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                {PLATFORM_FEATURE_FLAG_KEYS.map((key) => (
                  <th key={key} className="px-4 py-3 font-medium">
                    {key}
                    {key in control.globalFeatures ? (
                      <span className="ml-1 text-[10px] text-violet-700">G</span>
                    ) : null}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => {
                const effective = applyGlobalFeatureOverrides(
                  org.settings?.features,
                  control.globalFeatures,
                );

                return (
                <tr key={org.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${org.slug}`}>
                      {org.name}
                    </AdminLink>
                    <p className="mt-1 text-xs text-muted-foreground">/{org.slug}</p>
                  </td>
                  {PLATFORM_FEATURE_FLAG_KEYS.map((key) => {
                    const enabled = readFeature(effective, key);
                    const globallyForced = key in control.globalFeatures;

                    return (
                      <td key={key} className="px-4 py-3">
                        <form action={toggleOrganizationFeatureFlagAction}>
                          <input type="hidden" name="orgId" value={org.id} />
                          <input type="hidden" name="featureKey" value={key} />
                          <input
                            type="hidden"
                            name="nextEnabled"
                            value={enabled ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            title={
                              globallyForced
                                ? `${key} is globally forced; toggling still updates org storage`
                                : `Turn ${key} ${enabled ? "off" : "on"} for ${org.name}`
                            }
                            className="rounded-full transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                          >
                            <Badge
                              tone={
                                globallyForced
                                  ? "border-violet-300 bg-violet-50 text-violet-900"
                                  : enabled
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-border bg-muted/50 text-muted-foreground"
                              }
                            >
                              {enabled ? "On" : "Off"}
                              {globallyForced ? " ★" : ""}
                            </Badge>
                          </button>
                        </form>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(org.settings?.updatedAt)}
                  </td>
                </tr>
                );
              })}
              {organizations.length === 0 ? (
                <EmptyRow
                  colSpan={PLATFORM_FEATURE_FLAG_KEYS.length + 2}
                  label="No organizations found."
                />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
