import type { TicketPriority, TicketStatus } from "@prisma/client";
import type { getCaretakerTodayWorkData } from "./queries";

export type CaretakerTodayWorkPageData = Awaited<
  ReturnType<typeof getCaretakerTodayWorkData>
>;

export type TodayTask = {
  id: string;
  kind: "inspection" | "meter_reading" | "issue";
  title: string;
  subtitle: string;
  href: string;
  unitHref?: string;
  priority: "urgent" | "high" | "normal";
  dueLabel: string;
  actionLabel: string;
  issueSla?: {
    createdAt: Date;
    priority: TicketPriority;
    status: TicketStatus;
  };
};