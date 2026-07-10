export const MOVE_OUTS_LOAD_ERROR_MESSAGE =
  "We couldn't load move-out notices right now. Please refresh the page or try again in a few minutes.";

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}