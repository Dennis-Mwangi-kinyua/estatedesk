import { requirePlatformRole } from "@/lib/permissions/guards";
import { AgreementDetail } from "@/components/service-agreements/agreement-detail";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{id: string}>; searchParams: Promise<{error?: string; ok?: string}> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  return <AgreementDetail id={(await params).id} platformView {...await searchParams} />;
}
