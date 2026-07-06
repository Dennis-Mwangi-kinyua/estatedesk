export function formatInquiryDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatInquiryStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildVacancyInquiriesPageHref(
  page: number,
  status?: string,
) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (page > 1) params.set("page", String(page));

  const search = params.toString();
  return search
    ? `/dashboard/org/vacancy-inquiries?${search}`
    : "/dashboard/org/vacancy-inquiries";
}

export function inquiryStatusClasses(status: string) {
  switch (status) {
    case "NEW":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
    case "CONTACTED":
    case "VIEWING_SCHEDULED":
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
    case "CONVERTED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "CLOSED":
      return "border-border bg-muted/30 text-muted-foreground";
    default:
      return "border-border bg-muted/20 text-foreground";
  }
}