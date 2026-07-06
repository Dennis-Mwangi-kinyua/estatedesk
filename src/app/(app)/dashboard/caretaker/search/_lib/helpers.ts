export const SEARCH_LOAD_ERROR_MESSAGE =
  "We couldn't run search right now. Please refresh the page or try again in a few minutes.";

export function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function buildSearchHref(query: string) {
  const trimmed = query.trim();

  if (!trimmed) {
    return "/dashboard/caretaker/search";
  }

  return `/dashboard/caretaker/search?q=${encodeURIComponent(trimmed)}`;
}