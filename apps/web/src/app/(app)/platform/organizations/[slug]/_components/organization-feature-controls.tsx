import Link from "@/components/navigation/workspace-link";
import { getPlatformControl } from "@/lib/platform/control";
import { applyGlobalFeatureOverrides, parseFeatureMap } from "@/lib/org/features";
import { HIDE_PUBLIC_VACANCIES_KEY, ORGANIZATION_FEATURE_CONTROLS } from "@/lib/org/feature-controls";
import { toggleOrganizationFeatureFlagAction } from "../../../feature-flags/actions";
import { OrganizationFeatureToggle } from "./organization-feature-toggle";

export async function OrganizationFeatureControls({ orgId, orgName, features }: { orgId: string; orgName: string; features: unknown }) {
  const control = await getPlatformControl();
  const stored = parseFeatureMap(features);
  const effective = applyGlobalFeatureOverrides(features, control.globalFeatures);
  const controls = [{ key: HIDE_PUBLIC_VACANCIES_KEY, label: "Hide public vacant listings", description: "Hide this organization’s vacant houses from public browsing, search and direct listing links. Units and leases remain unchanged.", enabled: stored[HIDE_PUBLIC_VACANCIES_KEY] === true, locked: false },
    ...ORGANIZATION_FEATURE_CONTROLS.map(feature => ({ ...feature, enabled: effective[feature.key] ?? feature.defaultEnabled, locked: feature.key in control.globalFeatures }))];
  return <section id="organization-features" className="scroll-mt-5 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div><h2 className="text-lg font-semibold">Features and public vacancies</h2><p className="mt-1 text-sm text-muted-foreground">Scope: {orgName} only. Other organizations keep their settings. Platform-wide overrides are shown below; hiding public listings always applies to this organization.</p></div>
    <div className="grid gap-3 lg:grid-cols-2">{controls.map(feature => <form key={feature.key} action={toggleOrganizationFeatureFlagAction} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-4">
      <input type="hidden" name="orgId" value={orgId} /><input type="hidden" name="featureKey" value={feature.key} /><input type="hidden" name="nextEnabled" value={String(!feature.enabled)} />
      <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{feature.label}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{feature.description}</p>{feature.locked && <p className="mt-1 text-xs font-semibold text-primary">Platform override: {feature.enabled ? "On" : "Off"}</p>}</div>
      <OrganizationFeatureToggle label={feature.label} enabled={feature.enabled} locked={feature.locked} />
    </form>)}</div>
    <div className="flex flex-wrap gap-4 text-sm font-semibold"><Link href={`/platform/feature-flags?q=${encodeURIComponent(orgId)}`} className="inline-flex min-h-11 items-center text-primary">Manage this organization in the feature matrix →</Link><Link href="/platform/control" className="inline-flex min-h-11 items-center text-primary">Platform-wide overrides →</Link></div>
  </section>;
}
