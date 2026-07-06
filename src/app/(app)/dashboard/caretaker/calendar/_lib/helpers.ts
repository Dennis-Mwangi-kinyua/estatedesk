import type { CalendarEvent, CalendarDay } from "./types";

export const CALENDAR_LOAD_ERROR_MESSAGE =
  "We couldn't load the calendar right now. Please refresh the page or try again in a few minutes.";

export function startOfWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);

  return value;
}

export function endOfWeek(weekStart: Date) {
  const value = new Date(weekStart);
  value.setDate(value.getDate() + 7);
  return value;
}

export function parseWeekParam(value: string | undefined) {
  if (!value) {
    return startOfWeek(new Date());
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return startOfWeek(new Date());
  }

  return startOfWeek(parsed);
}

export function formatWeekLabel(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatter = new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
  });

  const yearFormatter = new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
  });

  return `${formatter.format(weekStart)} – ${formatter.format(weekEnd)}, ${yearFormatter.format(weekStart)}`;
}

export function buildCalendarWeekHref(weekStart: Date) {
  const iso = weekStart.toISOString().slice(0, 10);
  return `/dashboard/caretaker/calendar?week=${iso}`;
}

export function shiftWeek(weekStart: Date, deltaWeeks: number) {
  const value = new Date(weekStart);
  value.setDate(value.getDate() + deltaWeeks * 7);
  return value;
}

export function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildCalendarDays(
  weekStart: Date,
  events: CalendarEvent[],
): CalendarDay[] {
  const todayKey = toDayKey(new Date());
  const weekdayFormatter = new Intl.DateTimeFormat("en-KE", {
    weekday: "short",
  });
  const dayFormatter = new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    const key = toDayKey(date);

    return {
      key,
      label: dayFormatter.format(date),
      weekday: weekdayFormatter.format(date),
      isToday: key === todayKey,
      events: events
        .filter((event) => toDayKey(event.date) === key)
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    };
  });
}

export function eventKindLabel(kind: CalendarEvent["kind"]) {
  switch (kind) {
    case "inspection":
      return "Inspection";
    case "meter_reading":
      return "Meter reading";
    case "issue":
      return "Issue";
    case "move_out":
      return "Move-out";
    case "water_bill":
      return "Water bill";
    default:
      return "Task";
  }
}

export function eventKindClasses(kind: CalendarEvent["kind"]) {
  switch (kind) {
    case "inspection":
      return "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200";
    case "meter_reading":
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
    case "issue":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
    case "move_out":
      return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200";
    case "water_bill":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    default:
      return "border-border bg-muted/20 text-muted-foreground";
  }
}