import type { getCaretakerVendorsData } from "./queries";

export type CaretakerVendorsPageData = Awaited<
  ReturnType<typeof getCaretakerVendorsData>
>;