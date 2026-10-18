export type EndpointDoc = {
  method: string;
  path: string;
  auth: string;
  purpose: string;
  group: "public" | "webhook" | "cron" | "platform" | "health";
};

export const platformEndpointDocs: EndpointDoc[] = [
  {
    method: "GET",
    path: "/api/public/vacant-houses",
    auth: "Bearer edk_vacant_*",
    purpose: "Public vacant house listings for external sites",
    group: "public",
  },
  {
    method: "GET",
    path: "/api/health",
    auth: "None",
    purpose: "Liveness/readiness probe for platform health checks",
    group: "health",
  },
  {
    method: "POST",
    path: "/api/webhooks/mpesa",
    auth: "MPESA_CALLBACK_SECRET query param when configured",
    purpose: "M-Pesa STK callback reconciliation",
    group: "webhook",
  },
  {
    method: "POST",
    path: "/api/webhooks/kcb-ipn",
    auth: "KCB_BUNI_IPN_SIGNATURE_SECRET (Signature header or ?secret=)",
    purpose: "KCB Buni Instant Payment Notification (account credit)",
    group: "webhook",
  },
  {
    method: "GET/POST",
    path: "/api/cron/notifications",
    auth: "CRON_SECRET",
    purpose: "Dispatch queued notifications",
    group: "cron",
  },
  {
    method: "GET/POST",
    path: "/api/cron/retention",
    auth: "CRON_SECRET",
    purpose: "Retention and cleanup job",
    group: "cron",
  },
  {
    method: "GET/POST",
    path: "/api/cron/owner-statements",
    auth: "CRON_SECRET",
    purpose: "Scheduled owner statement emails",
    group: "cron",
  },
  {
    method: "GET",
    path: "/api/platform/data-exports/[slug]/download",
    auth: "Platform admin session",
    purpose: "Download approved organization data exports",
    group: "platform",
  },
  {
    method: "POST",
    path: "/api/monitoring/client-errors",
    auth: "Session / public beacon",
    purpose: "Client error reporting for ops diagnostics",
    group: "platform",
  },
  {
    method: "POST",
    path: "/api/monitoring/web-vitals",
    auth: "Session / public beacon",
    purpose: "Web vitals telemetry",
    group: "platform",
  },
];
