import type { ManagedUserSession } from "@/lib/auth/session";

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

export const SESSION_TIMEOUT_LABEL = "30 days of inactivity";

export function formatSessionDateTime(value: Date) {
  return dateTimeFormatter.format(value);
}

export function getDeviceLabel(userAgent: string | null) {
  if (!userAgent) return "Unknown device";

  const lower = userAgent.toLowerCase();
  if (lower.includes("okhttp")) return "App on Android";
  if (lower.includes("cfnetwork")) return "App on Apple device";
  const browser = lower.includes("edg/")
    ? "Edge"
    : lower.includes("chrome/")
      ? "Chrome"
      : lower.includes("safari/")
        ? "Safari"
        : lower.includes("firefox/")
          ? "Firefox"
          : "Browser";

  const device = lower.includes("tablet") || lower.includes("ipad")
    ? "Tablet"
    : lower.includes("mobile") || lower.includes("iphone")
      ? "Mobile"
      : lower.includes("android") ? "Android device" : "Desktop";

  return `${browser} on ${device}`;
}

export function isMobileSession(session: ManagedUserSession) {
  const agent = session.userAgent?.toLowerCase() ?? "";
  return ["mobile", "android", "iphone", "ipad", "okhttp", "cfnetwork"].some(value => agent.includes(value));
}
