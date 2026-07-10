export const HANDOVER_LOAD_ERROR_MESSAGE =
  "We couldn't load handover records right now. Please refresh the page or try again in a few minutes.";

export function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}