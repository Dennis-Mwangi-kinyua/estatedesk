import { NextResponse } from "next/server";
import { assertCronAllowed } from "@/lib/cron/auth";
import { runNotificationCron } from "@/lib/cron/jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handleNotificationCron(request: Request) {
  const gate = await assertCronAllowed(request);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const result = await runNotificationCron();

  return NextResponse.json(result);
}

export const GET = handleNotificationCron;
export const POST = handleNotificationCron;