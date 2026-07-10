import { formatLedgerCurrency, formatLedgerDate } from "@/lib/ledger";

export const PAYMENT_FILTERS = [
  { value: "all", label: "All occupants" },
  { value: "paid", label: "Paid" },
  { value: "not-paid", label: "Not fully paid" },
  { value: "partial", label: "Partial" },
  { value: "unpaid", label: "Unpaid" },
  { value: "default", label: "Default risk" },
  { value: "early", label: "Early payers" },
] as const;

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function ratingForTenant({
  paymentStatus,
  balance,
  amountDue,
  amountPaid,
  lastPaymentAt,
  dueDay,
}: {
  paymentStatus: string;
  balance: number;
  amountDue: number;
  amountPaid: number;
  lastPaymentAt: Date | null;
  dueDay: number | null;
}) {
  if (amountDue <= 0) {
    return {
      score: 0,
      label: "Not billed",
      detail: "No current-period obligation",
    };
  }

  const paidInFull = balance <= 0;
  const paidDay = lastPaymentAt ? lastPaymentAt.getDate() : null;
  const paidEarly = paidInFull && paidDay !== null && dueDay !== null && paidDay <= dueDay;

  if (paidEarly) {
    return {
      score: 5,
      label: "Early payer",
      detail: `Paid by day ${paidDay} against due day ${dueDay}`,
    };
  }

  if (paidInFull) {
    return {
      score: 4,
      label: "Paid in full",
      detail: lastPaymentAt ? `Last paid ${formatLedgerDate(lastPaymentAt)}` : "Fully settled",
    };
  }

  if (amountPaid > 0) {
    return {
      score: 3,
      label: "Partial payer",
      detail: `${formatLedgerCurrency(balance)} still open`,
    };
  }

  if (paymentStatus === "Default") {
    return {
      score: 1,
      label: "Default risk",
      detail: `${formatLedgerCurrency(balance)} overdue`,
    };
  }

  return {
    score: 2,
    label: "Unpaid",
    detail: `${formatLedgerCurrency(balance)} pending`,
  };
}

export function ratingTone(score: number) {
  if (score >= 5) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (score >= 4) {
    return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }
  if (score >= 3) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  if (score >= 1) {
    return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
  }
  return "border-border bg-muted/20 text-muted-foreground";
}

export function statusTone(status: string) {
  if (status === "Paid in full") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "Partial") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }
  if (status.includes("default") || status === "Default") {
    return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
  }
  if (status === "Overdue" || status === "Unpaid") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "border-border bg-muted/20 text-muted-foreground";
}

export function reportFilterHref({
  apartment,
  payment,
  period,
}: {
  apartment: string;
  payment: string;
  period?: string;
}) {
  const params = new URLSearchParams();

  if (apartment !== "all") params.set("apartment", apartment);
  if (payment !== "all") params.set("payment", payment);
  if (period) params.set("period", period);

  const query = params.toString();
  return query ? `/dashboard/org/reports?${query}` : "/dashboard/org/reports";
}

export function filterRowsByPayment<
  T extends {
    amountDue: number;
    amountPaid: number;
    balance: number;
    daysPastDue: number;
    rating: { score: number };
  },
>(rows: T[], paymentFilter: string) {
  switch (paymentFilter) {
    case "paid":
      return rows.filter((row) => row.amountDue > 0 && row.balance <= 0);
    case "not-paid":
      return rows.filter((row) => row.amountDue > 0 && row.balance > 0);
    case "partial":
      return rows.filter((row) => row.amountPaid > 0 && row.balance > 0);
    case "unpaid":
      return rows.filter((row) => row.amountDue > 0 && row.amountPaid <= 0);
    case "default":
      return rows.filter((row) => row.balance > 0 && row.daysPastDue > 5);
    case "early":
      return rows.filter((row) => row.rating.score >= 5);
    default:
      return rows;
  }
}