import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { OrgApiKeysOnboarding } from "@/components/help/org-api-keys-onboarding";
import type { requireUserSession } from "@/lib/auth/session";
import {
  createApiKeyAction,
  toggleApiKeyStatusAction,
} from "@/features/settings/actions/settings-actions";
import { buttonPrimaryClassName, fieldClassName } from "../../_lib/helpers";
import { formatLabel, type SettingsPageData } from "../../settings-data";
import { EmptyState, SectionCard, StatusBadge } from "../../settings-ui";

type Session = Awaited<ReturnType<typeof requireUserSession>>;

export function ApiKeysSection({
  data,
  session,
}: {
  data: SettingsPageData;
  session: Session;
}) {
  return (
    <SectionCard
      id="api-keys"
      title="API Keys"
      description="Create, review, and revoke application credentials."
    >
      <OrgApiKeysOnboarding orgRole={session.activeOrgRole} />

      <form
        action={createApiKeyAction}
        className="mb-5 grid gap-3 rounded-2xl border border-border bg-muted/10 p-4 md:grid-cols-[minmax(0,1fr)_180px_auto]"
      >
        <input
          type="text"
          name="name"
          placeholder="Accounting Integration"
          required
          className={fieldClassName}
        />

        <input type="date" name="expiresAt" className={fieldClassName} />

        <button type="submit" className={buttonPrimaryClassName}>
          Create API Key
        </button>
      </form>

      {data.apiKeys.length === 0 ? (
        <EmptyState
          title="No API keys yet"
          description="Create your first API key when you are ready to connect external apps or services."
          action={
            <InAppGuideLink
              topic="apiIntegrations"
              workspace="org"
              orgRole={session.activeOrgRole}
              variant="card"
            />
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.apiKeys.map((key) => {
            const isActive = key.status === "ACTIVE";

            return (
              <div
                key={key.id}
                className="rounded-[20px] border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {key.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last used: {key.lastUsed}
                    </p>
                  </div>

                  <StatusBadge
                    label={formatLabel(key.status)}
                    variant={isActive ? "success" : "danger"}
                  />
                </div>

                <form
                  action={toggleApiKeyStatusAction}
                  className="mt-4 flex justify-end"
                >
                  <input type="hidden" name="apiKeyId" value={key.id} />
                  <input
                    type="hidden"
                    name="nextActive"
                    value={isActive ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {isActive ? "Revoke Key" : "Activate Key"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}