import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { SETTINGS_GUIDANCE, SETTINGS_WORKFLOW_STEPS } from "../_lib/constants";
import { SETTINGS_NAV_ITEMS, type SettingsSectionId } from "../settings-ui-nav";
import { panelShellClassName } from "./settings-ui";

export function SettingsGuidance({
  orgRole,
  activeSectionId,
}: {
  orgRole?: OrgRole | null;
  activeSectionId?: SettingsSectionId;
}) {
  const quickLinks = SETTINGS_NAV_ITEMS.filter(
    (item) => !activeSectionId || item.id !== activeSectionId,
  ).slice(0, 4);

  return (
    <WorkspaceGuidePanel
      title="Recommended next steps"
      description="Common setup paths for a new or growing organization workspace."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Recommended next steps</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Common setup paths for a new or growing organization workspace.
        </p>

        <div className="mt-4 space-y-3">
          {SETTINGS_GUIDANCE.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-3 inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
              >
                {item.actionLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {activeSectionId ? (
        <section className={`${panelShellClassName} p-4`}>
          <h2 className="text-sm font-semibold text-foreground">Other settings</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Jump to another configuration area without returning home.
          </p>
          <div className="mt-4 space-y-2">
            {quickLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-xl border border-border bg-muted/10 px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/20"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className={`${panelShellClassName} p-4`}>
          <h2 className="text-sm font-semibold text-foreground">Setup checklist</h2>
          <ol className="mt-4 space-y-3">
            {SETTINGS_WORKFLOW_STEPS.map((item) => (
              <li
                key={item.step}
                className="rounded-2xl border border-border bg-muted/10 p-3"
              >
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">API integration guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how organization API keys and external integrations are managed.
        </p>
        <div className="mt-4">
          <InAppGuideLink
            topic="apiIntegrations"
            workspace="org"
            orgRole={orgRole}
            variant="card"
            className="w-full justify-center"
          />
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}