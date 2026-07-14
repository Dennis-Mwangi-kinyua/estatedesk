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
      <PwaLoadingCard />
      <span className="sr-only">Loading EstateDesk</span>
    </div>
  );
}

export function PwaLoadingCard() {
  return (
    <div className="pwa-loading-card">
      <div className="pwa-loading-card__icon" aria-hidden="true">
        <span className="pwa-launch-screen__spinner" />
      </div>
      <p className="pwa-loading-card__title">Loading your workspace</p>
      <p className="pwa-loading-card__message">
        Please wait while EstateDesk gets everything ready.
      </p>
      <div className="pwa-loading-dots" aria-hidden="true">
        <span className="pwa-loading-dot pwa-loading-dot--teal" />
        <span className="pwa-loading-dot pwa-loading-dot--violet" />
        <span className="pwa-loading-dot pwa-loading-dot--amber" />
      </div>
    </div>
  );
}
