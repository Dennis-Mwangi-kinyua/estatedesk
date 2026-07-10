import { requireUserSession } from "@/lib/auth/session";
import { LeasesWorkspace } from "./_components/leases-workspace";
import { getCaretakerLeasesData } from "./_lib/queries";
import type { LeasesPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function LeasesPage({ searchParams }: LeasesPageProps) {
  const session = await requireUserSession();
  const resolvedSearchParams = (await searchParams) ?? {};

  const data = await getCaretakerLeasesData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    page: Number(resolvedSearchParams.page ?? "1"),
  });

  return <LeasesWorkspace data={data} />;
}