export function formatCurrency(value: number) {
  return `KES ${value.toLocaleString()}`;
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export function statusBadgeClasses(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

export function unitStatusClasses(status: string) {
  switch (status) {
    case "OCCUPIED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "VACANT":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "RESERVED":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "UNDER_MAINTENANCE":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

export function issuePriorityClasses(priority: string) {
  switch (priority) {
    case "URGENT":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "HIGH":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

export function occupancyRate(occupied: number, total: number) {
  if (!total) return 0;
  return Math.round((occupied / total) * 100);
}