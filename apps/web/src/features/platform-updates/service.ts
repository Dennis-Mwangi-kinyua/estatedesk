import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { UPDATE_NOTICE_ID, type UpdateNotice } from "./policy";

export const UPDATE_NOTICE_CACHE_TAG = "public-update-notice";
// This record is identical for every visitor. Never cache session or role data here.
const getCachedNotice = unstable_cache(
  async (): Promise<UpdateNotice | null> => {
    const notice = await prisma.platformUpdateNotice.findUnique({
      where: { id: UPDATE_NOTICE_ID },
      select: { message: true, startsAt: true, endsAt: true },
    });
    // Next's persistent cache JSON-serializes its results. Store the public
    // representation so fresh reads and cache hits have the same date types.
    return notice ? {
      message: notice.message,
      startsAt: notice.startsAt.toISOString(),
      endsAt: notice.endsAt.toISOString(),
    } : null;
  },
  [UPDATE_NOTICE_CACHE_TAG],
  { revalidate: 30, tags: [UPDATE_NOTICE_CACHE_TAG] },
);

let pendingNotice: Promise<UpdateNotice | null> | undefined;

export async function getUpdateNotice(): Promise<UpdateNotice | null> {
  // Coalesce concurrent cold-cache requests without retaining another copy
  // of the notice that could survive tag invalidation after withdrawal.
  pendingNotice ??= getCachedNotice().finally(() => { pendingNotice = undefined; });
  const notice = await pendingNotice;
  if (!notice || Date.parse(notice.endsAt) <= Date.now()) return null;
  return notice;
}
