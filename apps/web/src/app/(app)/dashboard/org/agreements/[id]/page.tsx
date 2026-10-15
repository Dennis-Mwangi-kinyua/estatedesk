import { requireOrgRole } from "@/lib/permissions/guards";
import { AgreementDetail } from "@/components/service-agreements/agreement-detail";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{id: string}>; searchParams: Promise<{error?: string; ok?: string}> }) {
  await requireOrgRole(["ADMIN"]);
  return <AgreementDetail id={(await params).id} platformView={false} {...await searchParams} />;
}
