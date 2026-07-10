"use client";

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function isIosDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export async function ensureServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/");

  if (existing) {
    return existing;
  }

  return navigator.serviceWorker.register("/sw.js");
}

export async function activateWaitingServiceWorker() {
  const registration = await navigator.serviceWorker.getRegistration("/");
  const waitingWorker = registration?.waiting;

  if (!waitingWorker) {
    return false;
  }

  waitingWorker.postMessage({ type: "SKIP_WAITING" });
  return true;
}