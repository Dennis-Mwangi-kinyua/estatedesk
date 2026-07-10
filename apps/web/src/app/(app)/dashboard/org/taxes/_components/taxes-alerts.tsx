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
    <>
      {(!hasKraIntegration || !hasTaxpayerProfile || !hasRentalIncomeReturn) && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="text-base font-semibold text-red-800">
            Prisma client is missing new KRA models
          </h2>
          <p className="mt-1 text-sm text-red-700">
            Run <code>npx prisma generate</code>, stop the dev server, then start it again.
          </p>
        </section>
      )}

      {(taxpayerProfiles.length === 0 || integrations.length === 0) && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-amber-800">
            KRA setup still needs data
          </h2>
          <p className="mt-1 text-sm text-amber-700">
            This page is ready, but you still need at least one{" "}
            <span className="font-medium">TaxpayerProfile</span> and one{" "}
            <span className="font-medium">KraIntegration</span> row to start
            generating proper rental returns.
          </p>
        </section>
      )}
    </>
  );
}