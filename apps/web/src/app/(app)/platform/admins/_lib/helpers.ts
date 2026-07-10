import { dateFormatter } from "./constants";

export function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return dateFormatter.format(value);
}


export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}


