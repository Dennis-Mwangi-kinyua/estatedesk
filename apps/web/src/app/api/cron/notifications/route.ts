import { runNotificationCron } from "@/lib/cron/jobs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  const result = await runNotificationCron();
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
