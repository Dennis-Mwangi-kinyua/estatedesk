import "server-only";
import { prisma } from "@/lib/prisma";
import { personalNotificationScope } from "@/lib/notifications/recipient-scope";
import { readOrgRolePolicies } from "@/lib/permissions/org-role-policy";
import { applyOrganizationPlanAccess } from "@/lib/billing/organization-plan-policy";
import { getPlatformControl } from "@/lib/platform/control";

async function expoRequest(path: string, body: unknown) {
  const response = await fetch(`https://exp.host/--/api/v2/push/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}) },
    body: JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Native push provider unavailable.");
  return response.json();
}

/** Invoked by the existing operator-controlled notifications job. Never sends from a DB transaction. */
export async function dispatchNativePush() {
  if (process.env.NATIVE_PUSH_ENABLED !== "true") return { accepted: 0, failed: 0 };
  const control = await getPlatformControl();
  if (control.maintenanceMode || control.tenantPortalsDisabled) return { accepted: 0, failed: 0 };
  let accepted = 0, failed = 0;
  let attempted = 0;
  const deadline = Date.now() + 20_000;
  const devices = await prisma.nativePushDevice.findMany({
    where: { session: { expiresAt: { gt: new Date() }, user: { status: "ACTIVE", deletedAt: null, mustChangePassword: false, termsAcceptedAt: { not: null } } } },
    include: { session: { include: { activeMembership: { include: { org: { select: { status: true, deletedAt: true, settings: { select: { roleAccess: true } }, subscription: { select: { plan: true, metadata: true } } } } } } } } }, orderBy: { updatedAt: "asc" }, take: 100,
  });
  deviceLoop: for (const device of devices) {
    if (Date.now() >= deadline) break;
    // Rotate the bounded device scan so later registrations cannot starve.
    await prisma.nativePushDevice.updateMany({ where: { id: device.id }, data: { updatedAt: new Date() } });
    const membership = device.session.activeMembership;
    if (!membership || membership.orgId !== device.orgId || membership.deactivatedAt || membership.employmentEndedAt || membership.org.status !== "ACTIVE" || membership.org.deletedAt) continue;
    const policy = applyOrganizationPlanAccess(readOrgRolePolicies(membership.org.settings?.roleAccess)[membership.role], membership.org.subscription?.plan ?? "FREE", membership.org.subscription?.metadata);
    if (policy?.blockedViews.includes("notifications")) continue;
    const tenant = membership.role === "TENANT" ? await prisma.tenant.findFirst({ where: { orgId: device.orgId, userId: device.session.userId, deletedAt: null }, select: { id: true } }) : null;
    if (membership.role === "TENANT" && !tenant) continue;
    const notifications = await prisma.notification.findMany({
      where: { orgId: device.orgId, ...personalNotificationScope({ userId: device.session.userId, tenantId: tenant?.id }), channel: "IN_APP", status: "SENT", readAt: null,
        createdAt: { gte: new Date(Math.max(device.createdAt.getTime(), Date.now() - 86400_000)) }, nativePushDeliveries: { none: { deviceId: device.id } } },
      orderBy: { createdAt: "asc" }, take: 25, select: { id: true },
    });
    for (const notification of notifications) {
      if (attempted >= 50 || Date.now() >= deadline) break deviceLoop;
      // Unique claim prevents overlapping jobs from sending this update twice.
      const claim = await prisma.nativePushDelivery.createMany({ data: [{ deviceId: device.id, notificationId: notification.id }], skipDuplicates: true });
      if (!claim.count) continue;
      attempted++;
      const where = { deviceId_notificationId: { deviceId: device.id, notificationId: notification.id } };
      try {
        const result = await expoRequest("send", { to: device.token, sound: "default", title: "EstateDesk", body: "You have a new workspace notification.", data: { screen: "notifications" } });
        const ticket = result.data;
        if (ticket?.status === "ok" && typeof ticket.id === "string") {
          await prisma.nativePushDelivery.update({ where, data: { status: "ACCEPTED", ticketId: ticket.id } }); accepted++;
        } else {
          await prisma.nativePushDelivery.update({ where, data: { status: "FAILED" } }); failed++;
          if (ticket?.details?.error === "DeviceNotRegistered") { await prisma.nativePushDevice.deleteMany({ where: { id: device.id } }); break; }
        }
      } catch {
        // An uncertain provider response must not be automatically resent.
        await prisma.nativePushDelivery.updateMany({ where: { deviceId: device.id, notificationId: notification.id }, data: { status: "UNKNOWN" } }); failed++;
      }
    }
  }
  const pending = await prisma.nativePushDelivery.findMany({ where: { status: "ACCEPTED", ticketId: { not: null }, createdAt: { lt: new Date(Date.now() - 15 * 60_000) } }, take: 100 });
  if (pending.length) {
    const receipts = await expoRequest("getReceipts", { ids: pending.map(item => item.ticketId) });
    for (const item of pending) {
      const receipt = receipts.data?.[item.ticketId!];
      if (!receipt && item.createdAt.getTime() > Date.now() - 86400_000) continue;
      await prisma.nativePushDelivery.updateMany({ where: { id: item.id }, data: { status: receipt?.status === "ok" ? "DELIVERED" : "FAILED" } });
      if (receipt?.details?.error === "DeviceNotRegistered") await prisma.nativePushDevice.deleteMany({ where: { id: item.deviceId } });
    }
  }
  return { accepted, failed };
}
