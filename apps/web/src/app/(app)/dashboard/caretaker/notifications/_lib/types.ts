import type { getCaretakerNotificationsData } from "./queries";

export const PAGE_SIZE = 20;

export type NotificationsSearchParams = {
  page?: string;
};

export type NotificationsPageProps = {
  searchParams?: Promise<NotificationsSearchParams>;
};

export type CaretakerNotificationsPageData = Awaited<
  ReturnType<typeof getCaretakerNotificationsData>
>;