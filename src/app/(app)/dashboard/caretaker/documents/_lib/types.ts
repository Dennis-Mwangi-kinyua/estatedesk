import type { getCaretakerDocumentsData } from "./queries";

export type CaretakerDocumentsPageData = Awaited<
  ReturnType<typeof getCaretakerDocumentsData>
>;