import type { getCaretakerBillDetailData } from "./queries";

export type CaretakerBillDetailPageData = Awaited<
  ReturnType<typeof getCaretakerBillDetailData>
>;