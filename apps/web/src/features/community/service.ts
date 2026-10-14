import "server-only";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const noticeSchema = z.object({
  propertyId: z.string().min(1).max(120),
  targetTenantId: z.string().max(120).optional().transform(value => value || null),
  title: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(6000),
});
export async function publishCommunityNotice(orgId: string, actorUserId: string, input: unknown) {
  const data = noticeSchema.parse(input);
  const now = new Date();
  return prisma.$transaction(async tx => {
    const property = await tx.property.findFirst({ where: { id: data.propertyId, orgId, deletedAt: null } });
    if (!property) throw new Error("Property not found in your organization.");
    const { targetTenantId, ...noticeData } = data;
    const leases = await tx.lease.findMany({
      where: {
        orgId,
        status: "ACTIVE",
        deletedAt: null,
        unit: { propertyId: property.id, deletedAt: null },
        tenant: { deletedAt: null, ...(targetTenantId ? { id: targetTenantId } : {}) },
      },
      select: { tenant: { select: { id: true, userId: true } } },
    });
    if (targetTenantId && !leases.length) throw new Error("Choose a current tenant at the selected property.");
    const tenants = [...new Map(leases.map(l => [l.tenant.id, l.tenant])).values()];
    const guests = targetTenantId ? [] : await tx.bnbReservation.findMany({ where: { listing: { orgId, propertyId: property.id, deletedAt: null }, cancelledAt: null, checkedOutAt: null, checkIn: { lte: now }, checkOut: { gt: now } }, select: { id: true } });
    const notice = await tx.communityNotice.create({ data: { ...noticeData, orgId, publishedByUserId: actorUserId } });
    const recipients = [...tenants.map(t => ({ noticeId: notice.id, recipientKey: `tenant:${t.id}`, tenantId: t.id, userId: t.userId, reservationId: null as string | null })), ...guests.map(g => ({ noticeId: notice.id, recipientKey: `stay:${g.id}`, tenantId: null as string | null, userId: null as string | null, reservationId: g.id }))];
    // Chunk to stay within parameter limits while keeping publication and all deliveries atomic.
    for (let i = 0; i < recipients.length; i += 500) await tx.communityNoticeRecipient.createMany({ data: recipients.slice(i, i+500) });
    for (let i = 0; i < tenants.length; i += 500) await tx.notification.createMany({ data: tenants.slice(i,i+500).map(t => ({ orgId, tenantId: t.id, userId: t.userId, channel: "IN_APP", type: "GENERAL", status: "SENT", sentAt: now, title: `Official notice: ${data.title}`, message: `${data.message}\n\nCommunity notice board: /dashboard/tenant/community`, providerResponse: { communityNoticeId: notice.id, propertyId: property.id } })) });
    return { id: notice.id, recipients: recipients.length, targeted: Boolean(targetTenantId) };
  }, { timeout: 30000 });
}
