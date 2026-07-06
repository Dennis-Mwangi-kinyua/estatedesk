import type { getCaretakerIssueDetail } from "./queries";

export type CaretakerIssueDetailPageData = Awaited<
  ReturnType<typeof getCaretakerIssueDetail>
>;