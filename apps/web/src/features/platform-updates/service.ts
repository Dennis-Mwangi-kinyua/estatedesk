import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { UPDATE_NOTICE_ID, type UpdateNotice } from "./policy";

export const UPDATE_NOTICE_CACHE_TAG = "public-update-notice";
// This record is identical for every visitor. Never cache session or role data here.
const getCachedNotice = unstable_cache(
  () => prisma.platformUpdateNotice.findUnique({
    where: { id: UPDATE_NOTICE_ID },
    select: { message: true, startsAt: true, endsAt: true },
  }),
  [UPDATE_NOTICE_CACHE_TAG],
  { revalidate: 30, tags: [UPDATE_NOTICE_CACHE_TAG] },
);

export async function getUpdateNotice(): Promise<UpdateNotice | null> {
  const notice = await getCachedNotice();
  if (!notice || notice.endsAt <= new Date()) return null;
  return { message: notice.message, startsAt: notice.startsAt.toISOString(), endsAt: notice.endsAt.toISOString() };
}
