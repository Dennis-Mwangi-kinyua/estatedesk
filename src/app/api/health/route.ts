import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRuntimeEnvReport } from "@/lib/config/env";

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

  if (deep) {
    const dbStartedAt = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      database = {
        checked: true,
        status: "ok",
        latencyMs: Date.now() - dbStartedAt,
      };
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
    },
    status === "ok" ? 200 : 503,
  );
}
