import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { runOwnerStatementCron } from "@/lib/cron/jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handleOwnerStatementCron(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runOwnerStatementCron();
  return NextResponse.json(result);
}

export const GET = handleOwnerStatementCron;
export const POST = handleOwnerStatementCron;