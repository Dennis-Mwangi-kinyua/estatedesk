import { prisma } from "@/lib/prisma";
import { PRODUCT_UPDATES_DISMISSED_ID, updatesForAudience, type UpdateAudience } from "./catalog";
import { ProductUpdatesDialog } from "./dialog";

export async function ProductUpdatesBanner({ userId, audience }: { userId: string; audience: UpdateAudience }) {
  const relevant = updatesForAudience(audience);
  if (!relevant.length) return null;
  let read: { updateId: string }[];
  try {
    read = await prisma.productUpdateRead.findMany({
      where: { userId, updateId: { in: [PRODUCT_UPDATES_DISMISSED_ID, ...relevant.map(update => update.id)] } },
      select: { updateId: true },
    });
  } catch (error) {
    console.error("[ProductUpdatesBanner] update reads unavailable", error);
    return null;
  }
  const seen = new Set(read.map(item => item.updateId));
  if (seen.has(PRODUCT_UPDATES_DISMISSED_ID)) return null;
  const unread = relevant.filter(update => !seen.has(update.id));
  if (!unread.length) return null;
  return <ProductUpdatesDialog audience={audience} updates={unread} />;
}
