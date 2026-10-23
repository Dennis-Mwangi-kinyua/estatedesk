import { getReviewQueue } from "@/lib/workflow/review-queue";
import { ReviewQueue } from "@/components/shared/review-queue";
import { UpdateNoticeForm } from "@/features/platform-updates/form";
import { getUpdateNotice } from "@/features/platform-updates/service";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { PlatformDashboard } from "./_components/platform-dashboard";
import { getPlatformDashboardData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const data = await getPlatformDashboardData();

  const notice = await getUpdateNotice();
  return <div className="space-y-6"><ReviewQueue groups={await getReviewQueue(session, "platform")} summaryOnly /><PlatformDashboard data={data} /><UpdateNoticeForm current={notice} /></div>;
}