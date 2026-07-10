export const NOTIFICATIONS_LOAD_ERROR_MESSAGE =
  "We couldn't load notifications right now. Please refresh the page or try again in a few minutes.";

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function statusClasses(status: string) {
  if (status === "SENT") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
  }

  if (status === "FAILED") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
}

export function buildNotificationsPageHref(page: number) {
  if (page <= 1) {
    return "/dashboard/caretaker/notifications";
  }

  return `/dashboard/caretaker/notifications?page=${page}`;
}