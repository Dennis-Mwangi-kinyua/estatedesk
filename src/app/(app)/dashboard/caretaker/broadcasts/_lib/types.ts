import type { getCaretakerBroadcastsData } from "./queries";

export type CaretakerBroadcastsPageData = Awaited<
  ReturnType<typeof getCaretakerBroadcastsData>
>;