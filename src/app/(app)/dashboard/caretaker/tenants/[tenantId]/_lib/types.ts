import type { getCaretakerTenantDetailData } from "./queries";

export type TenantDetailPageProps = {
  params: Promise<{ tenantId: string }>;
};

export type CaretakerTenantDetailPageData = Awaited<
  ReturnType<typeof getCaretakerTenantDetailData>
>;