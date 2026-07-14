"use client";

import { useEffect } from "react";

const MINIMUM_VISIBLE_TIME_MS = 350;

export function PwaLaunchScreen() {
  useEffect(() => {
    const root = document.documentElement;

    if (root.dataset.pwaLaunch !== "visible") {
      return;
    }

    const startedAt = Number(root.dataset.pwaLaunchStartedAt) || performance.now();
    let frame = 0;
    let timeout = 0;

    frame = window.requestAnimationFrame(() => {
      const remaining = Math.max(
        0,
        MINIMUM_VISIBLE_TIME_MS - (performance.now() - startedAt),
      );

      timeout = window.setTimeout(() => {
        root.dataset.pwaLaunch = "ready";
      }, remaining);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="pwa-launch-screen" role="status" aria-label="EstateDesk is loading">
      {/* Keep the cached PWA icon independent of the image optimizer at startup. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="pwa-launch-screen__icon"
        src="/icons/icon-192.png"
        alt=""
        width="88"
        height="88"
      />
      <p className="pwa-launch-screen__name">EstateDesk</p>
      <span className="pwa-launch-screen__spinner" aria-hidden="true" />
      <span className="sr-only">Loading EstateDesk</span>
    </div>
  );
}
