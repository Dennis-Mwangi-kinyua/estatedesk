import type { getCaretakerCalendarData } from "./queries";

export type CalendarSearchParams = {
  week?: string;
};

export type CalendarPageProps = {
  searchParams?: Promise<CalendarSearchParams>;
};

export type CaretakerCalendarPageData = Awaited<
  ReturnType<typeof getCaretakerCalendarData>
>;

export type CalendarEventKind =
  | "inspection"
  | "meter_reading"
  | "issue"
  | "move_out"
  | "water_bill";

export type CalendarEvent = {
  id: string;
  kind: CalendarEventKind;
  title: string;
  subtitle: string;
  date: Date;
  href: string;
  priority: "urgent" | "high" | "normal";
};

export type CalendarDay = {
  key: string;
  label: string;
  weekday: string;
  isToday: boolean;
  events: CalendarEvent[];
};