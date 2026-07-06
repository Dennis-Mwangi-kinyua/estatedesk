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