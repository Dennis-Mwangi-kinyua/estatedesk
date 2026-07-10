import { requireUserSession } from "@/lib/auth/session";
import { NotificationsWorkspace } from "./_components/notifications-workspace";
import { getCaretakerNotificationsData } from "./_lib/queries";
import type { NotificationsPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function CaretakerNotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const session = await requireUserSession();
  const resolvedSearchParams = (await searchParams) ?? {};

  const data = await getCaretakerNotificationsData({
    orgId: session.activeOrgId!,
    userId: session.userId,
    page: Number(resolvedSearchParams.page ?? "1"),
  });

  return <NotificationsWorkspace data={data} />;
}