import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { PublishNoticeForm } from "@/features/community/forms";
export default async function CommunityManagementPage() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
  const orgId = session.activeOrgId!;
  const [properties, notices] = await Promise.all([prisma.property.findMany({ where: { orgId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }), prisma.communityNotice.findMany({ where: { orgId }, orderBy: { publishedAt: "desc" }, take: 100, include: { _count: { select: { recipients: true } }, recipients: { where: { readAt: { not: null } }, select: { id: true } } } })]);
  return <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6"><header><h1 className="text-3xl font-semibold">Community notice board</h1><p className="mt-2 text-muted-foreground">One official source for apartment announcements, service interruptions, safety updates, and community communication.</p></header><PublishNoticeForm properties={properties} /><section className="space-y-4"><h2 className="text-2xl font-semibold">Published notices</h2>{notices.map(notice => <article key={notice.id} className="space-y-3 rounded-2xl border bg-card p-5"><h3 className="text-xl font-semibold">{notice.title}</h3><p className="text-xs text-muted-foreground">{properties.find(p => p.id === notice.propertyId)?.name ?? "Property"} · {notice.publishedAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} EAT</p><p className="whitespace-pre-wrap break-words">{notice.message}</p><p className="text-sm font-medium">Delivered: {notice._count.recipients} · Read: {notice.recipients.length}</p></article>)}</section></main>;
}
