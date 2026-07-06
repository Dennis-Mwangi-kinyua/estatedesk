import type { getCaretakerReadingDetailData } from "./queries";

export type CaretakerReadingDetailPageData = Awaited<
  ReturnType<typeof getCaretakerReadingDetailData>
>;