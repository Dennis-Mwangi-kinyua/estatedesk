import {
  formatBillingPlanLabel,
  planSupportsTrial,
} from "@/lib/billing/plans";
import type { BarPoint, TrendPoint } from "./types";

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

export function formatCurrency(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(value);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short" }).format(date);
}

export function calcTrend(current: number, previous: number) {
  if (previous <= 0 && current > 0) return "+100%";
  if (previous <= 0) return "0%";
  const change = ((current - previous) / previous) * 100;
  const prefix = change >= 0 ? "+" : "";
  return `${prefix}${change.toFixed(1)}%`;
}

export function trendTone(current: number, previous: number) {
  if (current > previous) return "text-emerald-600 dark:text-emerald-300";
  if (current < previous) return "text-rose-600 dark:text-rose-300";
  return "text-slate-500 dark:text-slate-400";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type SubscriptionSummaryInput = {
  plan: string;
  status: string;
  currentPeriodEnd?: Date | null;
  trialEndsAt?: Date | null;
} | null | undefined;

export function formatSubscriptionSummary(subscription: SubscriptionSummaryInput) {
  if (!subscription) {
    return {
      label: "No plan",
      detail: "Billing not configured",
      tone: statusTone(null),
    };
  }

  const planLabel = formatBillingPlanLabel(subscription.plan);
  const planKey = subscription.plan.toUpperCase();
  const periodEnd = subscription.currentPeriodEnd;
  const trialEnd = subscription.trialEndsAt ?? subscription.currentPeriodEnd;

  if (planKey === "FREE") {
    return {
      label: "Free",
      detail: "Free workspace tier",
      tone: statusTone("active"),
    };
  }

  if (planKey === "ENTERPRISE") {
    return {
      label: "Enterprise",
      detail: periodEnd
        ? `Agreement renews ${formatDate(periodEnd)}`
        : "Custom enterprise agreement",
      tone: statusTone("active"),
    };
  }

  if (
    subscription.status === "TRIALING" &&
    planSupportsTrial(subscription.plan)
  ) {
    return {
      label: planLabel,
      detail: trialEnd
        ? `Trial ends ${formatDate(trialEnd)}`
        : "Trial period in progress",
      tone: statusTone("trialing"),
    };
  }

  if (subscription.status === "ACTIVE") {
    return {
      label: planLabel,
      detail: periodEnd
        ? `Renews ${formatDate(periodEnd)}`
        : "Active subscription",
      tone: statusTone("active"),
    };
  }

  const statusLabel = subscription.status.replaceAll("_", " ");

  return {
    label: planLabel,
    detail: periodEnd
      ? `${statusLabel} · ends ${formatDate(periodEnd)}`
      : statusLabel,
    tone: statusTone(subscription.status),
  };
}

export function statusTone(status: string | null | undefined) {
  const value = (status ?? "").toLowerCase();

  if (
    ["active", "paid", "paid_verified", "verified", "success", "enabled"].includes(
      value,
    )
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100";
  }

  if (
    [
      "trialing",
      "pending",
      "draft",
      "processing",
      "payment_pending",
      "issued",
      "partial",
    ].includes(value)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100";
  }

  if (
    [
      "cancelled",
      "canceled",
      "expired",
      "failed",
      "rejected",
      "overdue",
      "past_due",
      "inactive",
    ].includes(value)
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/30 dark:bg-rose-300/10 dark:text-rose-100";
  }

  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";
}

export function buildBars(values: number[]): BarPoint[] {
  const max = Math.max(...values, 1);
  return values.map((value, index) => ({
    id: index,
    value,
    height: Math.max(14, Math.round((value / max) * 100)),
  }));
}