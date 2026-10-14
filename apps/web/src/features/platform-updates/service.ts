import "server-only";
import { prisma } from "@/lib/prisma";
import { UPDATE_NOTICE_ID, type UpdateNotice } from "./policy";

export async function getUpdateNotice(): Promise<UpdateNotice | null> {
  const notice = await prisma.platformUpdateNotice.findUnique({ where: { id: UPDATE_NOTICE_ID } });
  if (!notice || notice.endsAt <= new Date()) return null;
  return { message: notice.message, startsAt: notice.startsAt.toISOString(), endsAt: notice.endsAt.toISOString() };
}
