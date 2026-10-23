import { requirePlatformRole } from "@/lib/permissions/guards";
import { getReviewQueue } from "@/lib/workflow/review-queue";
import { ReviewQueue } from "@/components/shared/review-queue";
export const dynamic = "force-dynamic";
export default async function ReviewQueuePage() {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  return <main className="space-y-6 p-4 sm:p-6"><h1 className="text-2xl font-semibold">Review queue</h1><ReviewQueue groups={await getReviewQueue(session, "platform")} /></main>;
}
