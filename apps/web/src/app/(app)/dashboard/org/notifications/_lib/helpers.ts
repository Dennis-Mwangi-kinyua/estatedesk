import { Clock3, Send, XCircle } from "lucide-react";
import {
  cn,
  formatEnumLabel,
  formatMoney,
  toNumber,
} from "@/lib/formatters";
import type { PaymentItem } from "@/app/(app)/dashboard/org/notifications/_lib/types";

export { cn, formatEnumLabel, formatMoney, toNumber };

export function formatDateTime(
  value: Date | string | null | undefined,
  timezone = "Africa/Nairobi",
) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export function getNotificationStatusMeta(status: string) {
  switch (status) {
    case "SENT":
      return {
        icon: Send,
        tone: "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300",
      };
    case "FAILED":
      return {
        icon: XCircle,
        tone: "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300",
      };
    default:
      return {
        icon: Clock3,
        tone: "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300",
      };
  }
}

export function getPaymentLabel(payment: PaymentItem) {
  if (payment.waterBill?.period) return `Water ${payment.waterBill.period}`;
  if (payment.rentCharge?.period) return `Rent ${payment.rentCharge.period}`;
  if (payment.taxCharge?.period) {
    return `${formatEnumLabel(payment.taxCharge.taxType)} ${payment.taxCharge.period}`;
  }
  return formatEnumLabel(payment.targetType);
}

type FeedRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  status: string;
  readAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
  } | null;
  tenant: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
  } | null;
};

/**
 * `notifyRecipients` creates one DB row per channel (IN_APP, SMS, EMAIL, …).
 * Collapse those into a single feed event so the org communication feed
 * does not look duplicated.
 */
export function collapseNotificationFeedRows<T extends FeedRow>(
  rows: T[],
  limit = 18,
): Array<T & { channels: string[] }> {
  const CHANNEL_RANK: Record<string, number> = {
    IN_APP: 0,
    WEB_PUSH: 1,
    SMS: 2,
    WHATSAPP: 3,
    EMAIL: 4,
  };

  const STATUS_RANK: Record<string, number> = {
    FAILED: 0,
    QUEUED: 1,
    SENT: 2,
  };

  type Group = {
    primary: T;
    channels: Set<string>;
    statuses: string[];
    readAt: Date | null;
  };

  const groups = new Map<string, Group>();
  const order: string[] = [];

  for (const row of rows) {
    const createdMs =
      row.createdAt instanceof Date
        ? row.createdAt.getTime()
        : new Date(row.createdAt).getTime();
    // Same fan-out batch shares the same second; bucket by minute for safety.
    const timeBucket = Number.isFinite(createdMs)
      ? Math.floor(createdMs / 60_000)
      : 0;
    const key = [
      row.type,
      row.title,
      row.message,
      row.user?.id ?? "",
      row.tenant?.id ?? "",
      String(timeBucket),
    ].join("\u0001");

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        primary: row,
        channels: new Set([row.channel]),
        statuses: [row.status],
        readAt: row.readAt,
      });
      order.push(key);
      continue;
    }

    existing.channels.add(row.channel);
    existing.statuses.push(row.status);

    // Prefer IN_APP row as the mark-read / primary identity.
    const existingRank = CHANNEL_RANK[existing.primary.channel] ?? 99;
    const nextRank = CHANNEL_RANK[row.channel] ?? 99;
    if (nextRank < existingRank) {
      existing.primary = row;
    }

    // Unread wins if any channel row is unread (usually IN_APP).
    if (!row.readAt) {
      existing.readAt = null;
    } else if (existing.readAt === undefined || existing.readAt) {
      existing.readAt = existing.readAt ?? row.readAt;
    }
  }

  const collapsed = order.map((key) => {
    const group = groups.get(key)!;
    const status = group.statuses.reduce((worst, current) => {
      const worstRank = STATUS_RANK[worst] ?? 99;
      const currentRank = STATUS_RANK[current] ?? 99;
      return currentRank < worstRank ? current : worst;
    }, group.statuses[0] ?? "QUEUED");

    const channels = [...group.channels].sort(
      (a, b) => (CHANNEL_RANK[a] ?? 99) - (CHANNEL_RANK[b] ?? 99),
    );

    return {
      ...group.primary,
      channel: channels[0] ?? group.primary.channel,
      channels,
      status,
      readAt: group.readAt,
    };
  });

  return collapsed.slice(0, limit);
}