import type { getCaretakerUnitsData } from "./queries";

export const PAGE_SIZE = 24;

export type CaretakerUnitsPageData = Awaited<
  ReturnType<typeof getCaretakerUnitsData>
>;

export type CaretakerUnitsPageSuccess = Extract<
  CaretakerUnitsPageData,
  { ok: true }
>;

export type CaretakerUnitListItem = CaretakerUnitsPageSuccess["units"][number];