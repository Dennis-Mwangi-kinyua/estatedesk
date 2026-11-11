import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { queueClosingReminders, deliverRecruitmentMessages } from "@/features/recruitment/automation";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET ? Buffer.from(`Bearer ${process.env.CRON_SECRET}`) : null;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  if (!expected || expected.length !== actual.length || !timingSafeEqual(expected, actual)) return new Response("Unauthorized", { status: 401 });
  const run = await prisma.cronJobRun.create({ data: { jobName: "recruitment", endpoint: "/api/cron/recruitment", triggerSource: "CRON" } });
  try {
    const queued = await queueClosingReminders();
    const result = await deliverRecruitmentMessages();
    await prisma.cronJobRun.update({ where: { id: run.id }, data: { status: result.failed ? "FAILED" : "SUCCESS", finishedAt: new Date(), processedCount: result.accepted + result.failed + result.cancelled, successCount: result.accepted, failedCount: result.failed, metadata: { queued, cancelled: result.cancelled } } });
    return Response.json({ queued, ...result }, { status: result.failed ? 503 : 200 });
  } catch {
    await prisma.cronJobRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), error: "Recruitment automation failed. Check database and delivery configuration." } });
    return Response.json({ error: "Recruitment automation failed" }, { status: 503 });
  }
}
