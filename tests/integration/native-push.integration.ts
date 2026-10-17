import assert from "node:assert/strict";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("native delivery claims are unique, hide content, reconcile receipts, and die with revoked sessions", { skip: !databaseUrl }, async () => {
  const { fixture } = await import("./move-out-fixture");
  const { dispatchNativePush } = await import("../../apps/web/src/lib/mobile/push");
  const f = await fixture();
  const previousFetch = globalThis.fetch;
  const previousEnabled = process.env.NATIVE_PUSH_ENABLED;
  const calls: Array<{ path: string; body: Record<string, unknown> }> = [];
  process.env.NATIVE_PUSH_ENABLED = "true";
  globalThis.fetch = async (input, options) => {
    const path = String(input);
    const body = JSON.parse(String(options?.body));
    calls.push({ path, body });
    return Response.json(path.endsWith("getReceipts") ? { data: { "test-ticket": { status: "ok" } } } : { data: { status: "ok", id: "test-ticket" } });
  };
  try {
    const membership = await f.prisma.membership.create({ data: { orgId: f.org.id, userId: f.actor.id, role: "MANAGER" } });
    const session = await f.prisma.userSession.create({ data: { userId: f.actor.id, activeMembershipId: membership.id, tokenHash: `test-native-${f.org.id}`, expiresAt: new Date(Date.now() + 3600000) } });
    const device = await f.prisma.nativePushDevice.create({ data: { sessionId: session.id, orgId: f.org.id, token: `ExpoPushToken[${f.org.id}]`, platform: "android", createdAt: new Date(Date.now() - 60000) } });
    const notification = await f.prisma.notification.create({ data: { orgId: f.org.id, userId: f.actor.id, channel: "IN_APP", type: "ISSUE_CREATED", title: "Private tenant issue", message: "Sensitive account details never sent to a lock screen", status: "SENT", sentAt: new Date() } });
    // Another user's message must not be included in this device's delivery set.
    await f.prisma.notification.create({ data: { orgId: f.org.id, tenantId: f.tenant.id, channel: "IN_APP", type: "ISSUE_CREATED", title: "Other recipient", message: "Not this device", status: "SENT", sentAt: new Date() } });
    await Promise.all([dispatchNativePush(), dispatchNativePush()]);
    assert.equal(calls.filter(call => call.path.endsWith("/send")).length, 1);
    assert.equal(JSON.stringify(calls).includes("Sensitive account"), false);
    assert.equal(await f.prisma.nativePushDelivery.count({ where: { deviceId: device.id, notificationId: notification.id } }), 1);
    await f.prisma.nativePushDelivery.updateMany({ where: { deviceId: device.id }, data: { createdAt: new Date(Date.now() - 16 * 60000) } });
    await dispatchNativePush();
    assert.equal((await f.prisma.nativePushDelivery.findFirstOrThrow({ where: { deviceId: device.id } })).status, "DELIVERED");
    await f.prisma.userSession.delete({ where: { id: session.id } });
    assert.equal(await f.prisma.nativePushDevice.count({ where: { id: device.id } }), 0);
    assert.equal(await f.prisma.nativePushDelivery.count({ where: { deviceId: device.id } }), 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousEnabled === undefined) delete process.env.NATIVE_PUSH_ENABLED; else process.env.NATIVE_PUSH_ENABLED = previousEnabled;
    await f.cleanup();
  }
});
