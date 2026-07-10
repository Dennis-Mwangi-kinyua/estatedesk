import {
  loadNotificationsPageData,
  normalizeNotificationFilter,
} from "@/app/(app)/dashboard/org/notifications/_lib/queries";
import type { PageProps } from "@/app/(app)/dashboard/org/notifications/_lib/types";
import { NotificationsWorkspace } from "@/app/(app)/dashboard/org/notifications/_components/notifications-workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizationNotificationsPage({
  searchParams,
}: PageProps) {
  const activeFilter = normalizeNotificationFilter((await searchParams)?.filter);
  const data = await loadNotificationsPageData(activeFilter);

  return <NotificationsWorkspace activeFilter={activeFilter} data={data} />;
}
