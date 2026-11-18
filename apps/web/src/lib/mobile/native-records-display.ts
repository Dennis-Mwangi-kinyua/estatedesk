import type { NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
export type Value = string | number | boolean | Date | null | undefined | { toString(): string };
export function display(value: Value): string {
  if (value === null || value === undefined || value === "") return "—";
  if (value instanceof Date) return value.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric" });
  return typeof value === "boolean" ? value ? "Yes" : "No" : String(value);
}
export function card(id: string, title: string, status: string | undefined, fields: Record<string, Value>, subtitle = ""): NativeWorkspaceRecord {
  return { id, title, status, subtitle, fields: Object.entries(fields).map(([label, value]) => ({ label, value: display(value) })) };
}
