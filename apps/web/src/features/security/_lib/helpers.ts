import type { ManagedUserSession } from "@/lib/auth/session";

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const SESSION_TIMEOUT_LABEL = "30 days of inactivity";

export function formatSessionDateTime(value: Date) {
  return dateTimeFormatter.format(value);
}

export function getDeviceLabel(userAgent: string | null) {
  if (!userAgent) return "Unknown device";

  const lower = userAgent.toLowerCase();
  const browser = lower.includes("edg/")
    ? "Edge"
    : lower.includes("chrome/")
      ? "Chrome"
      : lower.includes("safari/")
        ? "Safari"
        : lower.includes("firefox/")
          ? "Firefox"
          : "Browser";

  const device = lower.includes("mobile")
    ? "Mobile"
    : lower.includes("tablet") || lower.includes("ipad")
      ? "Tablet"
      : "Desktop";

  return `${browser} on ${device}`;
}

export function isMobileSession(session: ManagedUserSession) {
  return session.userAgent?.toLowerCase().includes("mobile") ?? false;
}
