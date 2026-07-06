"use client";

export function isAppBadgeSupported() {
  return (
    typeof navigator !== "undefined" &&
    "setAppBadge" in navigator &&
    typeof navigator.setAppBadge === "function"
  );
}

export async function syncAppBadge(count: number) {
  if (!isAppBadgeSupported()) {
    return false;
  }

  if (count > 0) {
    await navigator.setAppBadge(Math.min(count, 99));
    return true;
  }

  if ("clearAppBadge" in navigator && typeof navigator.clearAppBadge === "function") {
    await navigator.clearAppBadge();
    return true;
  }

  await navigator.setAppBadge(0);
  return true;
}