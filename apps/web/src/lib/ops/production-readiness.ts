import "server-only";

import { getRuntimeEnvReport } from "@/lib/config/env";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { isPendingUpgradeRequest } from "@/lib/billing/upgrade-request-policy";

export type ProductionCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  blocking: boolean;
};

function envConfigured(key: string) {
  const value = process.env[key];
  return Boolean(value && value.trim());
}

/**
 * Server-side production readiness snapshot for platform operators.
 * Human gates (legal, GSC, counsel) are reported as operator-pending, not auto-pass.
 */
export async function getProductionReadinessReport() {
  const env = getRuntimeEnvReport();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    queuedNotifications,
    failedNotifications,
    failedPayments24h,
    pendingGateway,
    pastDueSubscriptions,
    failedCrons24h,
    recentSubscriptions,
  ] = await retryTransientDatabaseOperation(
    () =>
      Promise.all([
        prisma.notification.count({ where: { status: "QUEUED" } }),
        prisma.notification.count({ where: { status: "FAILED" } }),
        prisma.payment.count({
          where: {
            gatewayStatus: "FAILED",
            createdAt: { gte: dayAgo },
          },
        }),
        prisma.payment.count({
          where: {
            gatewayStatus: { in: ["PENDING", "INITIATED"] },
            createdAt: { gte: weekAgo },
          },
        }),
        prisma.subscription.count({ where: { status: "PAST_DUE" } }),
        prisma.cronJobRun.count({
          where: { status: "FAILED", startedAt: { gte: dayAgo } },
        }),
        prisma.subscription.findMany({
          orderBy: { updatedAt: "desc" },
          take: 100,
          select: { metadata: true },
        }),
      ]),
    { label: "production-readiness-metrics", attempts: 3, delayMs: 400 },
  );

  const pendingUpgrades = recentSubscriptions.filter((sub) =>
    isPendingUpgradeRequest(sub.metadata),
  ).length;

  const checks: ProductionCheck[] = [];

  checks.push({
    id: "env-required",
    label: "Required environment variables",
    status: env.missingRequired === 0 ? "pass" : "fail",
    detail:
      env.missingRequired === 0
        ? `All ${env.total} tracked keys present for required set (${env.configured} configured).`
        : `${env.missingRequired} required env keys missing.`,
    blocking: true,
  });

  checks.push({
    id: "app-url",
    label: "Canonical app URL",
    status:
      envConfigured("NEXT_PUBLIC_APP_URL") || envConfigured("APP_URL")
        ? "pass"
        : "fail",
    detail: "NEXT_PUBLIC_APP_URL / APP_URL must match the production domain.",
    blocking: true,
  });

  checks.push({
    id: "database",
    label: "Database URL",
    status: envConfigured("DATABASE_URL") ? "pass" : "fail",
    detail: envConfigured("DATABASE_URL")
      ? "DATABASE_URL is set."
      : "DATABASE_URL is missing.",
    blocking: true,
  });

  checks.push({
    id: "cron-secret",
    label: "Cron authorization",
    status: envConfigured("CRON_SECRET") ? "pass" : "warn",
    detail: envConfigured("CRON_SECRET")
      ? "CRON_SECRET set for /api/cron/* and deep health."
      : "CRON_SECRET missing — cron and deep health are not secured.",
    blocking: true,
  });

  checks.push({
    id: "security-alerts",
    label: "Security alert webhook",
    status:
      envConfigured("SECURITY_ALERT_WEBHOOK_URL") ||
      envConfigured("ALERT_WEBHOOK_URL")
        ? "pass"
        : "warn",
    detail:
      envConfigured("SECURITY_ALERT_WEBHOOK_URL") ||
      envConfigured("ALERT_WEBHOOK_URL")
        ? "Alert webhook configured."
        : "No SECURITY_ALERT_WEBHOOK_URL — alerts only log to console.",
    blocking: false,
  });

  const mpesaReady =
    envConfigured("MPESA_CONSUMER_KEY") &&
    envConfigured("MPESA_CONSUMER_SECRET") &&
    envConfigured("MPESA_SHORTCODE") &&
    envConfigured("MPESA_PASSKEY") &&
    envConfigured("MPESA_CALLBACK_URL");

  checks.push({
    id: "mpesa",
    label: "M-Pesa Daraja credentials",
    status: mpesaReady ? "pass" : "warn",
    detail: mpesaReady
      ? "Core Daraja env keys present — still run a live STK E2E on production."
      : "M-Pesa env incomplete — STK checkout will not work in production.",
    blocking: false,
  });

  const kcbReady =
    envConfigured("KCB_BUNI_IPN_SIGNATURE_SECRET") ||
    envConfigured("KCB_BUNI_IPN_CALLBACK_URL");

  checks.push({
    id: "kcb",
    label: "KCB Buni IPN",
    status: kcbReady ? "pass" : "warn",
    detail: kcbReady
      ? "KCB IPN env partially/fully set — confirm callback registration."
      : "KCB IPN not configured (OK if you only use M-Pesa).",
    blocking: false,
  });

  checks.push({
    id: "notification-queue",
    label: "Notification queue depth",
    status:
      failedNotifications > 20
        ? "fail"
        : queuedNotifications > 200 || failedNotifications > 0
          ? "warn"
          : "pass",
    detail: `Queued ${queuedNotifications}, failed ${failedNotifications}.`,
    blocking: false,
  });

  checks.push({
    id: "payment-failures",
    label: "Gateway payment failures (24h)",
    status: failedPayments24h > 10 ? "fail" : failedPayments24h > 0 ? "warn" : "pass",
    detail: `${failedPayments24h} FAILED gateway payments in last 24h; ${pendingGateway} pending/initiated (7d).`,
    blocking: false,
  });

  checks.push({
    id: "subscriptions",
    label: "Subscription health",
    status: pastDueSubscriptions > 0 ? "warn" : "pass",
    detail: `${pastDueSubscriptions} PAST_DUE subscriptions; ${pendingUpgrades} pending upgrade requests.`,
    blocking: false,
  });

  checks.push({
    id: "cron-failures",
    label: "Cron job failures (24h)",
    status: failedCrons24h > 0 ? "warn" : "pass",
    detail: `${failedCrons24h} failed cron runs in last 24h.`,
    blocking: false,
  });

  checks.push({
    id: "legal",
    label: "Kenya legal counsel sign-off",
    status: "warn",
    detail:
      "Operator gate: complete docs/KENYA_LEGAL_REVIEW.md sign-off before broad commercial launch.",
    blocking: true,
  });

  checks.push({
    id: "restore-drill",
    label: "Backup restore drill",
    status: "warn",
    detail:
      "Operator gate: complete disposable restore with evidence in docs/RESTORE_DRILL_EVIDENCE.md.",
    blocking: true,
  });

  checks.push({
    id: "gsc",
    label: "Search Console sitemap",
    status: "warn",
    detail:
      "Operator gate: submit https://estatedesk.co.ke/sitemap-index.xml in GSC/Bing.",
    blocking: false,
  });

  checks.push({
    id: "a11y",
    label: "Manual accessibility QA",
    status: "warn",
    detail:
      "Operator gate: complete docs/ACCESSIBILITY_QA.md matrix on authenticated roles.",
    blocking: false,
  });

  const blockingFails = checks.filter((c) => c.blocking && c.status === "fail");
  const blockingWarns = checks.filter((c) => c.blocking && c.status === "warn");
  const readyForSoftLaunch =
    blockingFails.length === 0 &&
    env.missingRequired === 0 &&
    envConfigured("DATABASE_URL");

  return {
    checkedAt: now.toISOString(),
    readyForSoftLaunch,
    blockingFails: blockingFails.length,
    blockingPending: blockingWarns.length,
    metrics: {
      queuedNotifications,
      failedNotifications,
      failedPayments24h,
      pendingGateway,
      pastDueSubscriptions,
      pendingUpgrades,
      failedCrons24h,
    },
    checks,
  };
}
