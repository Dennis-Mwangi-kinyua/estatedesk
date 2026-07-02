import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { runRetentionCron } from "@/lib/cron/jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handleRetentionCron(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runRetentionCron();

  return NextResponse.json(result);
}

export const GET = handleRetentionCron;
export const POST = handleRetentionCron;