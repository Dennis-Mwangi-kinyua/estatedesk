export type TenantNotificationFilter =
  | "all"
  | "unread"
  | "payments"
  | "issues"
  | "moveouts"
  | "water";

export type TenantNotificationsPageData = {
  tenant: {
    id: string;
    orgId: string;
    fullName: string;
  };
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    channel: string;
    status: string;
    readAt: Date | null;
    createdAt: Date;
  }>;
  unreadCount: number;
  activeFilter: TenantNotificationFilter;
};