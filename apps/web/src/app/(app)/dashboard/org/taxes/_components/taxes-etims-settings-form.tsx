import { Settings2 } from "lucide-react";
import type { KraIntegration } from "@prisma/client";
import { isEncryptedSecret } from "@/lib/crypto/secrets";
import { saveOrgEtimsSettingsAction } from "../_lib/etims-settings-actions";

type IntegrationRow = Pick<
  KraIntegration,
  | "environment"
  | "filingMode"
  | "status"
  | "clientId"
  | "clientSecretCiphertext"
  | "webhookSecretCiphertext"
  | "apiBaseUrl"
  | "eritsBaseUrl"
  | "controlUnitSerial"
  | "branchOfficeId"
  | "lastSyncAt"
  | "lastError"
>;

const field =
  "mt-1.5 w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-4 focus:ring-ring/20";
const label = "block text-xs font-semibold text-foreground";

export function TaxesEtimsSettingsForm({
  integration,
}: {
  integration: IntegrationRow | null;
}) {
  const secretPlaceholder = integration?.clientSecretCiphertext
    ? isEncryptedSecret(integration.clientSecretCiphertext)
      ? "•••••••• (saved — leave blank to keep)"
      : "•••••••• (saved — leave blank to keep)"
    : "";

  return (
    <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Settings2 className="h-4 w-4 text-primary" />
          Organization eTIMS settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Per-org credentials override platform env when present. Secrets are
          stored encrypted at rest (AES-256-GCM).
        </p>
      </div>

      <form action={saveOrgEtimsSettingsAction} className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className={label}>
            Environment
            <select
              name="environment"
              className={field}
              defaultValue={integration?.environment ?? "SANDBOX"}
            >
              <option value="SANDBOX">Sandbox</option>
              <option value="PRODUCTION">Production</option>
            </select>
          </label>

          <label className={label}>
            Filing mode
            <select
              name="filingMode"
              className={field}
              defaultValue={integration?.filingMode ?? "HYBRID"}
            >
              <option value="HYBRID">Hybrid</option>
              <option value="API">API</option>
              <option value="ERITS_MANUAL">eRITS manual</option>
            </select>
          </label>

          <label className={label}>
            Status
            <select
              name="status"
              className={field}
              defaultValue={integration?.status ?? "ACTIVE"}
            >
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
              <option value="ERROR">Error</option>
            </select>
          </label>

          <label className={label}>
            Client ID
            <input
              name="clientId"
              className={field}
              defaultValue={integration?.clientId ?? ""}
              autoComplete="off"
              placeholder="KRA client id"
            />
          </label>

          <label className={label}>
            Client secret
            <input
              name="clientSecret"
              type="password"
              className={field}
              placeholder={secretPlaceholder || "Paste new secret"}
              autoComplete="new-password"
            />
          </label>

          <label className={label}>
            Webhook secret
            <input
              name="webhookSecret"
              type="password"
              className={field}
              placeholder={
                integration?.webhookSecretCiphertext
                  ? "•••••••• (leave blank to keep)"
                  : "Optional HMAC secret"
              }
              autoComplete="new-password"
            />
          </label>

          <label className={label}>
            Control unit serial
            <input
              name="controlUnitSerial"
              className={field}
              defaultValue={integration?.controlUnitSerial ?? ""}
              placeholder="CU serial from KRA device"
            />
          </label>

          <label className={label}>
            Branch office ID (bhfId)
            <input
              name="branchOfficeId"
              className={field}
              defaultValue={integration?.branchOfficeId ?? "00"}
              placeholder="00"
            />
          </label>

          <label className={label}>
            API base URL
            <input
              name="apiBaseUrl"
              className={field}
              defaultValue={integration?.apiBaseUrl ?? ""}
              placeholder="https://etims-api-sbx.kra.go.ke"
            />
          </label>

          <label className={`${label} sm:col-span-2`}>
            eRITS base URL
            <input
              name="eritsBaseUrl"
              className={field}
              defaultValue={integration?.eritsBaseUrl ?? ""}
              placeholder="Optional eRITS portal/API base"
            />
          </label>
        </div>

        {integration?.lastError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
            Last error: {integration.lastError}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Save eTIMS settings
        </button>
      </form>
    </section>
  );
}
