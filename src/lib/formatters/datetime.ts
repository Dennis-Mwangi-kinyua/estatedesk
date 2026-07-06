const DEFAULT_LOCALE = "en-KE";

export function formatDate(
  value: Date | string | null | undefined,
  options?: { timeZone?: string },
) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(options?.timeZone ? { timeZone: options.timeZone } : {}),
  }).format(date);
}

export function formatDateTime(
  value: Date | string | null | undefined,
  timeZone = "Africa/Nairobi",
) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}