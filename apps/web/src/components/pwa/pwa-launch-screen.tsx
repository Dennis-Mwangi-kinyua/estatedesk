"use client";

import { useEffect, useState } from "react";

const MAXIMUM_VISIBLE_TIME_MS = 12_000;

export function PwaLaunchScreen() {
  const [slow, setSlow] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    if (root.dataset.pwaLaunch !== "visible") {
      return;
    }

    let firstFrame = 0;
    let secondFrame = 0;

    const reveal = () => {
      root.dataset.pwaLaunch = "ready";
    };

    const revealAfterStablePaint = () => {
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          reveal();
        });
      });
    };

    // Hydrated content is ready to use; images and other late resources can
    // finish loading without keeping the launch screen over the interface.
    revealAfterStablePaint();

    const safetyTimeout = window.setTimeout(reveal, MAXIMUM_VISIBLE_TIME_MS);
    const slowTimeout = window.setTimeout(() => setSlow(true), 4_000);
    const recoveryTimeout = window.setTimeout(() => setShowRecovery(true), 8_000);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(safetyTimeout);
      window.clearTimeout(slowTimeout);
      window.clearTimeout(recoveryTimeout);
    };
  }, []);

  return (
    <div className="pwa-launch-screen" role="status" aria-label="EstateDesk is loading">
      <PwaLoadingCard slow={slow} />
      {showRecovery ? (
        <div className="pwa-launch-recovery">
          <button data-workspace-action="true" type="button" onClick={() => window.location.reload()}>Try again</button>
          <button data-workspace-action="true" type="button" onClick={() => { document.documentElement.dataset.pwaLaunch = "ready"; }}>Continue to app</button>
        </div>
      ) : null}
      <span className="sr-only">Loading EstateDesk</span>
    </div>
  );
}

export function PwaLoadingCard({ slow = false }: { slow?: boolean }) {
  return (
    <div className="pwa-loading-card">
      <div className="pwa-loading-card__icon" aria-hidden="true">
        <span className="pwa-launch-screen__spinner" />
      </div>
      <p className="pwa-loading-card__title">Loading your workspace</p>
      <p className="pwa-loading-card__message">
        {slow
          ? "Still loading — your connection may be slow."
          : "Please wait while EstateDesk gets everything ready."}
      </p>
      <div className="pwa-loading-dots" aria-hidden="true">
        <span className="pwa-loading-dot pwa-loading-dot--teal" />
        <span className="pwa-loading-dot pwa-loading-dot--teal" />
        <span className="pwa-loading-dot pwa-loading-dot--amber" />
      </div>
    </div>
  );
}
