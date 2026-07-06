import type { getCaretakerMoveOutsData } from "./queries";

export type CaretakerMoveOutsPageData = Awaited<
  ReturnType<typeof getCaretakerMoveOutsData>
>;