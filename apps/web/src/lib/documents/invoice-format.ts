export function formatMoney(amount: number, currencyCode = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(value);
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  }).format(value);
}

export function getInvoiceStatusClasses(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-500/20 text-emerald-100";
    case "PARTIAL":
      return "bg-amber-500/20 text-amber-100";
    default:
      return "bg-sky-500/20 text-sky-100";
  }
}