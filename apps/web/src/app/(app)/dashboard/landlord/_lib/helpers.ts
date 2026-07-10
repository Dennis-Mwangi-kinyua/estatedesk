export function formatCurrency(value: unknown) {
  const amount =
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function unitStatusTone(status: string) {
  switch (status) {
    case "OCCUPIED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "VACANT":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "RESERVED":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export function paymentStatusTone(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "PARTIAL":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    case "UNPAID":
    case "OVERDUE":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export function getPortfolioHealthTone(portfolioHealth: string) {
  switch (portfolioHealth) {
    case "Healthy":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Watch":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-red-200 bg-red-50 text-red-800";
  }
}