import { prisma } from "@/lib/prisma";
import { updatesForAudience, type UpdateAudience } from "./catalog";
import { acknowledgeProductUpdates } from "./actions";
import { ActionForm } from "@/features/providers/forms";
export async function ProductUpdatesBanner({ userId, audience }: { userId: string; audience: UpdateAudience }) {
  const relevant = updatesForAudience(audience);
  if (!relevant.length) return null;
  let read: { updateId: string }[];
  try { read = await prisma.productUpdateRead.findMany({ where: { userId, updateId: { in: relevant.map(update => update.id) } }, select: { updateId: true } }); } catch (error) { console.error("[ProductUpdatesBanner] update reads unavailable", error); return null; }
  const seen = new Set(read.map(item => item.updateId));
  const unread = relevant.filter(update => !seen.has(update.id));
  return <aside data-product-updates className="relative z-10 mx-auto my-3 w-[calc(100%-2rem)] max-w-5xl rounded-2xl border border-primary/30 bg-card p-4 text-card-foreground"><details open={unread.length > 0}><summary className="cursor-pointer font-semibold text-primary">{unread.length ? `New updates for your role (${unread.length})` : "What’s new in EstateDesk"}</summary><ul className="mt-4 space-y-3">{relevant.map(update => <li key={update.id} className="rounded-xl border border-border p-3"><p className="font-semibold">{update.title}{!seen.has(update.id) ? <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">New</span> : null}</p><p className="mt-1 text-sm text-muted-foreground">{update.description}</p></li>)}</ul>{unread.length ? <div className="mt-4"><ActionForm action={acknowledgeProductUpdates} label="Mark these updates as read"><input type="hidden" name="audience" value={audience} /></ActionForm></div> : null}</details></aside>;
}
