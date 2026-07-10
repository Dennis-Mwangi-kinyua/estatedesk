import type { loadTaxesPageData } from "./queries";

export type TaxesPageData = Awaited<ReturnType<typeof loadTaxesPageData>>;