export const READING_DETAIL_LOAD_ERROR_MESSAGE =
  "We couldn't load this meter reading right now. Please refresh the page or try again in a few minutes.";

export function readingStatusTone(status: string) {
  if (status === "APPROVED") return "green" as const;
  if (status === "SUBMITTED") return "blue" as const;
  return "neutral" as const;
}