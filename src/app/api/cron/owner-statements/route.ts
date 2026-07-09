import { NextResponse } from "next/server";
import { assertCronAllowed } from "@/lib/cron/auth";
import { runOwnerStatementCron } from "@/lib/cron/jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handleOwnerStatementCron(request: Request) {
  const gate = await assertCronAllowed(request);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const result = await runOwnerStatementCron();
  return NextResponse.json(result);
}

export const GET = handleOwnerStatementCron;
export const POST = handleOwnerStatementCron;