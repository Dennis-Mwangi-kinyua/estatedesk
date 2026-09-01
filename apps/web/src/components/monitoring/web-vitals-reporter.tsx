"use client";

import { useReportWebVitals } from "next/web-vitals";

const enabled =
  process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === "true" ||
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";

function EnabledWebVitalsReporter() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
      path: window.location.pathname,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/monitoring/web-vitals", body);
      return;
    }

    void fetch("/api/monitoring/web-vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  });

  return null;
}

export function WebVitalsReporter() {
  if (!enabled) return null;

  return <EnabledWebVitalsReporter />;
}
