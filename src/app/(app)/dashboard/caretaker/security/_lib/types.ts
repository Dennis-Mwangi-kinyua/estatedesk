import type { getCaretakerSecurityData } from "./queries";

export type CaretakerSecurityPageData = Awaited<
  ReturnType<typeof getCaretakerSecurityData>
>;