import { notFound, redirect } from "next/navigation";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { TenantDetailWorkspace } from "./_components/tenant-detail-workspace";
import { getCaretakerTenantDetailData } from "./_lib/queries";
import type { TenantDetailPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function CaretakerTenantDetailPage({
  params,
}: TenantDetailPageProps) {
  const { tenantId: publicTenantId } = await params;
  const session = await requireCaretakerAccess();

  const data = await getCaretakerTenantDetailData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    publicTenantId,
  });

  if (!data.ok) {
    if (data.notFound) notFound();
    return <TenantDetailWorkspace data={data} />;
  }

  if (data.redirectTo) redirect(data.redirectTo);
  return <TenantDetailWorkspace data={data} />;
}