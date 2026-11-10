/** Calendar boundaries use Nairobi rather than the workstation timezone. */
export function todayBounds(now: Date) {
  const day = new Date(now.getTime() + 3 * 3600000).toISOString().slice(0, 10);
  const start = new Date(`${day}T00:00:00+03:00`);
  return { start, end: new Date(start.getTime() + 86400000) };
}
export function todayUrgency(dueAt: Date | null, now: Date): "overdue" | "today" | "normal" {
  if (!dueAt) return "normal";
  if (dueAt < now) return "overdue";
  return dueAt < todayBounds(now).end ? "today" : "normal";
}

export function billUrgency(dueAt: Date, now: Date): "overdue" | "today" | "normal" {
  const { start, end } = todayBounds(now);
  return dueAt < start ? "overdue" : dueAt < end ? "today" : "normal";
}
