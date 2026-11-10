import "server-only";
import { Prisma, type PrismaClient } from "@prisma/client";
/** Keep routing/provider references when an authorized operator retries a failure. */
export async function requeueFailedNotifications(db: Pick<PrismaClient, "$executeRaw">, actorId: string, id?: string) {
  const count = await db.$executeRaw`
    UPDATE "Notification" SET status='QUEUED',"sentAt"=NULL,
      "providerResponse"=(CASE WHEN jsonb_typeof("providerResponse")='object' THEN "providerResponse" ELSE '{}'::jsonb END)-'error'
        || jsonb_build_object('retriedAt',${new Date().toISOString()}::text,'retriedBy',${actorId}::text)
    WHERE status='FAILED' ${id ? Prisma.sql`AND id=${id}` : Prisma.empty}`;
  return { count };
}
