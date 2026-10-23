import { z } from "zod";
import type { ReportFilters } from "@estatedesk/contracts/mobile";
const day = 86400000;
const dateKey = (date: Date) => new Date(date.getTime() + 3 * 3600000).toISOString().slice(0, 10);
function start(key: string) {
  const date = new Date(`${key}T00:00:00+03:00`);
  if (!Number.isFinite(date.getTime()) || dateKey(date) !== key) throw new z.ZodError([{ code: "custom", path: ["from"], message: "Choose valid calendar dates." }]);
  return date;
}
export function reportPeriod(filters: Pick<ReportFilters, "reportPeriod" | "from" | "to">, now = new Date()) {
  const today = dateKey(now);
  let from = today, to = today;
  if (filters.reportPeriod === "month") from = `${today.slice(0, 7)}-01`;
  if (filters.reportPeriod === "lastMonth") {
    const end = new Date(start(`${today.slice(0, 7)}-01`).getTime() - day);
    to = dateKey(end); from = `${to.slice(0, 7)}-01`;
  }
  if (filters.reportPeriod === "custom") { from = filters.from ?? ""; to = filters.to ?? ""; }
  const gte = start(from), endDay = start(to), lt = new Date(endDay.getTime() + day);
  if (gte > endDay || to > today || lt.getTime() - gte.getTime() > 366 * day) throw new z.ZodError([{ code: "custom", path: ["to"], message: "Choose up to 366 days ending no later than today." }]);
  // Stop today's period at now; compare exactly the same elapsed duration.
  const end = lt > now ? now : lt;
  const previousStart = new Date(gte.getTime() - (lt.getTime() - gte.getTime()));
  const previousEnd = new Date(previousStart.getTime() + (end.getTime() - gte.getTime()));
  return { from, to, current: { gte, lt: end }, previous: { gte: previousStart, lt: previousEnd }, previousFrom: dateKey(previousStart), previousTo: dateKey(new Date(previousEnd.getTime() - 1)) };
}
export function trend(current: number, previous: number) {
  const delta = current - previous;
  return previous === 0 ? current === 0 ? "No change (0 to 0)" : `+${delta} · no previous activity` : `${delta >= 0 ? "+" : ""}${delta} (${((delta / previous) * 100).toFixed(1)}%)`;
}
