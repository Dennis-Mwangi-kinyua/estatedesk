import type { getCaretakerProfileData } from "./queries";

export type CaretakerProfilePageData = Awaited<
  ReturnType<typeof getCaretakerProfileData>
>;

export type CaretakerProfileMember = NonNullable<
  Extract<CaretakerProfilePageData, { ok: true }>["member"]
>;