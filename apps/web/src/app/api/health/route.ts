import { NextResponse } from "next/server";
import { getRuntimeEnvReport } from "@/lib/config/env";
import { isCronAuthorized } from "@/lib/cron/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HealthStatus = "ok" | "degraded";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "1";
  const env = getRuntimeEnvReport();
  let status: HealthStatus = env.ready ? "ok" : "degraded";
  let database:
    | { checked: false }
    | { checked: true; status: "ok"; latencyMs: number }
    | { checked: true; status: "error"; latencyMs: number } = { checked: false };

  let ops:
    | {
        checked: true;
        queuedNotifications: number;
        failedNotifications: number;
        failedPayments24h: number;
        pendingGateway7d: number;
        pastDueSubscriptions: number;
        failedCrons24h: number;
      }
    | { checked: false } = { checked: false };

  if (deep) {
    if (!isCronAuthorized(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const dbStartedAt = Date.now();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
      await prisma.$queryRaw`SELECT 1`;
      database = {
        checked: true,
        status: "ok",
        latencyMs: Date.now() - dbStartedAt,
      };

      const [
        queuedNotifications,
        failedNotifications,
        failedPayments24h,
        pendingGateway7d,
        pastDueSubscriptions,
        failedCrons24h,
      ] = await Promise.all([
        prisma.notification.count({ where: { status: "QUEUED" } }),
        prisma.notification.count({ where: { status: "FAILED" } }),
        prisma.payment.count({
          where: { gatewayStatus: "FAILED", createdAt: { gte: dayAgo } },
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
      ]);

      ops = {
        checked: true,
        queuedNotifications,
        failedNotifications,
        failedPayments24h,
        pendingGateway7d,
        pastDueSubscriptions,
        failedCrons24h,
      };

      if (
        failedNotifications > 50 ||
        failedPayments24h > 25 ||
        failedCrons24h > 5
      ) {
        status = "degraded";
      }
    } catch {
      database = {
        checked: true,
        status: "error",
        latencyMs: Date.now() - dbStartedAt,
      };
      status = "degraded";
    }
  }

  return jsonResponse(
    {
      service: "estatedesk",
      status,
      checkedAt: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      environment: {
        ready: env.ready,
        configured: env.configured,
        total: env.total,
        missingRequired: env.missingRequired,
      },
      database,
      ops,
    },
    status === "ok" ? 200 : 503,
  );
}
