import {
  formatDateTime,
  getStatusClasses,
} from "../_lib/helpers";
import type { TaxesPageData } from "../_lib/types";

export function TaxesIntegrationsPanel({
  integrations,
  stats,
  taxpayerProfiles,
}: Pick<TaxesPageData, "integrations" | "stats" | "taxpayerProfiles">) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">KRA Integration Status</h2>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Connected Orgs</p>
            <p className="mt-2 text-2xl font-semibold">{stats.activeIntegrations}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Total Setups</p>
            <p className="mt-2 text-2xl font-semibold">{integrations.length}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Taxpayer Profiles</p>
            <p className="mt-2 text-2xl font-semibold">{taxpayerProfiles.length}</p>
          </div>
        </div>

        {integrations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No KRA integration rows found yet.
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.slice(0, 5).map((integration) => (
              <div key={integration.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{integration.org.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {integration.filingMode} · {integration.environment}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                      integration.status,
                    )}`}
                  >
                    {integration.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>API Base URL: {integration.apiBaseUrl ?? "—"}</p>
                  <p>eRITS URL: {integration.eritsBaseUrl ?? "—"}</p>
                  <p>Last Sync: {formatDateTime(integration.lastSyncAt)}</p>
                  <p>Last Error: {integration.lastError ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}