import { CheckCircle2, AlertTriangle, Shield } from "lucide-react";

type Readiness = {
  configured: boolean;
  environment: string;
  baseUrl: string | null;
  controlUnitSerial: string | null;
  notes: string[];
  statusLabel: string;
};

export function TaxesEtimsPanel({ readiness }: { readiness: Readiness }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Shield className="h-4 w-4 text-primary" />
          KRA eTIMS readiness
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live sales receipts submit when credentials and control unit serial are set.
          Receipts always store eTIMS-shaped fields for audit.
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div
          className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
            readiness.configured
              ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/30"
              : "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/30"
          }`}
        >
          {readiness.configured ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {readiness.statusLabel}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Environment: {readiness.environment}
              {readiness.baseUrl ? ` · ${readiness.baseUrl}` : ""}
            </p>
            {readiness.controlUnitSerial ? (
              <p className="mt-1 break-all text-xs text-muted-foreground">
                CU serial: {readiness.controlUnitSerial}
              </p>
            ) : null}
          </div>
        </div>

        {readiness.notes.length > 0 ? (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {readiness.notes.map((note) => (
              <li
                key={note}
                className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2"
              >
                {note}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Verified payments attempt eTIMS sales submission after receipt snapshot.
            Webhook: <code className="text-xs">/api/webhooks/kra-etims</code>
          </p>
        )}

        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/15 px-3 py-2">
            <dt className="font-semibold uppercase tracking-wide text-muted-foreground">
              Env vars
            </dt>
            <dd className="mt-1 text-foreground">
              KRA_ETIMS_ENVIRONMENT, CLIENT_ID, CLIENT_SECRET, BASE_URL, CU_SERIAL,
              WEBHOOK_SECRET, BHF_ID
            </dd>
          </div>
          <div className="rounded-lg border bg-muted/15 px-3 py-2">
            <dt className="font-semibold uppercase tracking-wide text-muted-foreground">
              Receipt path
            </dt>
            <dd className="mt-1 text-foreground">
              Payment verify → eTIMS payload → CU signature (when live) → PDF footer
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
