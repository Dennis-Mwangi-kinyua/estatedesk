const DEV_REFRESH_FLAG = process.env.NEXT_PUBLIC_DEV_BACKGROUND_REFRESH === "true";
const DEV_LOGIN_TIMING_FLAG = process.env.DEV_LOGIN_TIMING === "true";

export function isBackgroundRefreshEnabled() {
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  return DEV_REFRESH_FLAG;
}

export function getPollingIntervalMs(defaultMs: number) {
  if (!isBackgroundRefreshEnabled()) {
    return 0;
  }

  if (process.env.NODE_ENV === "production") {
    return defaultMs;
  }

  return Math.max(defaultMs, 120_000);
}

export function isLoginTimingEnabled() {
  return DEV_LOGIN_TIMING_FLAG;
}

export function isDevDebugLoggingEnabled() {
  return process.env.DEV_DEBUG_LOGS === "true";
}