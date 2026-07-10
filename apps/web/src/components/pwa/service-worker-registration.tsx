"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    const enableInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_IN_DEV === "true";

    if (
      (process.env.NODE_ENV !== "production" && !enableInDev) ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA support should never block the core application.
      });
    });
  }, []);

  return null;
}
