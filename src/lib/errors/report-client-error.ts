type ClientErrorReport = {
  context: string;
  digest?: string;
};

export function reportClientError(payload: ClientErrorReport) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    context: payload.context,
    digest: payload.digest,
    path: window.location.pathname,
  });

  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/monitoring/client-errors", blob);
    return;
  }

  void fetch("/api/monitoring/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}