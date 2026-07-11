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
          <div className="rounded-lg border border-dashed p-4 text-sm leading-6 text-muted-foreground sm:p-6">
            No KRA integration rows found yet.
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.slice(0, 5).map((integration) => (
              <div key={integration.id} className="rounded-xl border p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium leading-5">{integration.org.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {integration.filingMode} · {integration.environment}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                      integration.status,
                    )}`}
                  >
                    {integration.status}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="min-w-0 rounded-lg border bg-muted/20 px-3 py-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      API Base URL
                    </dt>
                    <dd className="mt-0.5 break-all text-foreground">
                      {integration.apiBaseUrl ?? "—"}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-lg border bg-muted/20 px-3 py-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      eRITS URL
                    </dt>
                    <dd className="mt-0.5 break-all text-foreground">
                      {integration.eritsBaseUrl ?? "—"}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-lg border bg-muted/20 px-3 py-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Last sync
                    </dt>
                    <dd className="mt-0.5 text-foreground">
                      {formatDateTime(integration.lastSyncAt)}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-lg border border-red-200/60 bg-red-50/40 px-3 py-2 dark:border-red-500/20 dark:bg-red-500/5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Last error
                    </dt>
                    <dd className="mt-0.5 break-words leading-6 text-foreground">
                      {integration.lastError ?? "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}