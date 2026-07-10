import type { getCaretakerUnitDetailData } from "./queries";

export type CaretakerUnitDetailPageData = Awaited<
  ReturnType<typeof getCaretakerUnitDetailData>
>;