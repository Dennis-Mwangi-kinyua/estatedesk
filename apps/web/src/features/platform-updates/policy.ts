export const UPDATE_NOTICE_ID = "global";
export const UPDATE_TIME_ZONE = "Africa/Nairobi";
export type UpdateNotice = { message: string; startsAt: string; endsAt: string };

export function parseUpdateWindow(start: string, duration: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start)) throw new Error("Choose a valid update date and time.");
  const startsAt = new Date(`${start}:00+03:00`);
  // Reject calendar rollover (for example, February 30).
  const local = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);
  if (!Number.isFinite(startsAt.getTime()) || local.toISOString().slice(0, 16) !== start) throw new Error("Choose a valid update date and time.");
  if (startsAt <= now) throw new Error("Choose a future update time.");
  const minutes = Number(duration);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) throw new Error("Enter an update duration between 1 and 1,440 minutes.");
  return { startsAt, endsAt: new Date(startsAt.getTime() + minutes * 60 * 1000) };
}

export function formatUpdateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-KE", { timeZone: UPDATE_TIME_ZONE, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value)) + " EAT";
}
