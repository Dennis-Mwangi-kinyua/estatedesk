import { getNotice } from "./_lib/helpers";
import { getPlatformUserDetails } from "./_lib/queries";
import type { PlatformUserDetailsPageProps } from "./_lib/types";
import { UserDetailWorkspace } from "./_components/user-detail-workspace";

export const dynamic = "force-dynamic";

export default async function PlatformUserDetailsPage({ params, searchParams }: PlatformUserDetailsPageProps) {
  const { id } = await params;
  const paramsValue = await searchParams;
  const details = await getPlatformUserDetails(id);
  const notice = getNotice(paramsValue);

  return <UserDetailWorkspace details={details} notice={notice} />;
}
