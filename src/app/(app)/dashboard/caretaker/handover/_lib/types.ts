import type { getCaretakerHandoverData } from "./queries";

export type CaretakerHandoverPageData = Awaited<
  ReturnType<typeof getCaretakerHandoverData>
>;

export type SubmitHandoverState = {
  error?: string;
  success?: string;
};