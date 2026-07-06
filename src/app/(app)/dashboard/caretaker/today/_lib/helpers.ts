import { startOfToday } from "@/app/(app)/dashboard/caretaker/_lib/helpers";

export const TODAY_WORK_LOAD_ERROR_MESSAGE =
  "We couldn't load today's work right now. Please refresh the page or try again in a few minutes.";

export function endOfToday() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

export function formatTaskTime(value: Date | null | undefined) {
  if (!value) return "No time set";

  return new Intl.DateTimeFormat("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}