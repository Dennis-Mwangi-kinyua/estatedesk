import { requireUserSession } from "@/lib/auth/session";
import { TenantsWorkspace } from "./_components/tenants-workspace";
import { getCaretakerTenantsData } from "./_lib/queries";
import type { TenantsPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function TenantsPage({ searchParams }: TenantsPageProps) {
  const session = await requireUserSession();
  const resolvedSearchParams = (await searchParams) ?? {};

  const data = await getCaretakerTenantsData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    page: Number(resolvedSearchParams.page ?? "1"),
    query: resolvedSearchParams.q ?? "",
  });

  return <TenantsWorkspace data={data} />;
}
