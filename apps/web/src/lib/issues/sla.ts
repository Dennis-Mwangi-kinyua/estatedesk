import { TicketPriority, TicketStatus } from "@prisma/client";

const SLA_HOURS: Record<TicketPriority, number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

const CLOSED_STATUSES = new Set<TicketStatus>([
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
  TicketStatus.CANCELLED,
]);

export type IssueSlaState = {
  label: string;
  tone: "neutral" | "warning" | "overdue";
};

export function getIssueSlaState({
  createdAt,
  priority,
  status,
  now = new Date(),
}: {
  createdAt: Date;
  priority: TicketPriority;
  status: TicketStatus;
  now?: Date;
}): IssueSlaState | null {
  if (CLOSED_STATUSES.has(status)) {
    return null;
  }

  const slaHours = SLA_HOURS[priority];
  const deadlineMs = createdAt.getTime() + slaHours * 60 * 60 * 1000;
  const remainingMs = deadlineMs - now.getTime();

  if (remainingMs <= 0) {
    const overdueHours = Math.max(
      1,
      Math.ceil(Math.abs(remainingMs) / (60 * 60 * 1000)),
    );
    return {
      label: `${overdueHours}h overdue`,
      tone: "overdue",
    };
  }

  const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

  if (remainingHours <= Math.max(2, Math.floor(slaHours * 0.25))) {
    return {
      label: `${remainingHours}h left`,
      tone: "warning",
    };
  }

  return {
    label: `SLA ${slaHours}h`,
    tone: "neutral",
  };
}

export function getIssueSlaClassName(tone: IssueSlaState["tone"]) {
  switch (tone) {
    case "overdue":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
    default:
      return "border-border bg-muted/20 text-muted-foreground";
  }
}