import { requireCurrentOrgId } from "@/lib/auth/org";
import { MemberDetailWorkspace } from "./_components/member-detail-workspace";
import { getMemberDetailData } from "./_lib/queries";
import type { Props } from "./_lib/types";

export default async function MemberDetailPage({ params }: Props) {
  const { role, membershipId } = await params;
  const orgId = await requireCurrentOrgId();
  const data = await getMemberDetailData(orgId, role, membershipId);

  return <MemberDetailWorkspace {...data} />;
}
