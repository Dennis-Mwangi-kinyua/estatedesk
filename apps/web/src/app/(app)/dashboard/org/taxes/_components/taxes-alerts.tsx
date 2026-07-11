import type { TaxesPageData } from "../_lib/types";

export function TaxesAlerts({
  hasKraIntegration,
  hasTaxpayerProfile,
  hasRentalIncomeReturn,
  taxpayerProfiles,
  integrations,
}: Pick<
  TaxesPageData,
  | "hasKraIntegration"
  | "hasTaxpayerProfile"
  | "hasRentalIncomeReturn"
  | "taxpayerProfiles"
  | "integrations"
>) {
  return (
    <div className="space-y-3">
      {(!hasKraIntegration || !hasTaxpayerProfile || !hasRentalIncomeReturn) && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4">
          <h2 className="text-sm font-semibold leading-5 text-red-800 sm:text-base">
            Prisma client is missing new KRA models
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-red-700">
            Run{" "}
            <code className="break-all rounded bg-red-100/80 px-1.5 py-0.5 text-xs sm:text-sm">
              npx prisma generate
            </code>
            , stop the dev server, then start it again.
          </p>
        </section>
      )}

      {(taxpayerProfiles.length === 0 || integrations.length === 0) && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
          <h2 className="text-sm font-semibold leading-5 text-amber-900 sm:text-base">
            KRA setup still needs data
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-amber-800">
            This page is ready, but you still need at least one{" "}
            <span className="font-medium">TaxpayerProfile</span> and one{" "}
            <span className="font-medium">KraIntegration</span> row to start
            generating proper rental returns.
          </p>
        </section>
      )}
    </div>
  );
}