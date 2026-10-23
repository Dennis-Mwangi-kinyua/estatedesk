/** Cached database rows can contain ISO strings instead of Date instances. */
export function vacancyRecordDate(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value instanceof Date ? value.getTime() : value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", year: "numeric", month: "short", day: "numeric" });
}
