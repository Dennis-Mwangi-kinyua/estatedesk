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
  const params = await searchParams;
  const activeFilter = normalizeNotificationFilter(params?.filter);
  const page = Number.parseInt(params?.page ?? "0", 10);
  const data = await loadNotificationsPageData(activeFilter, params?.q ?? "", Number.isFinite(page) ? page : 0);

  return <NotificationsWorkspace activeFilter={activeFilter} data={data} />;
}
