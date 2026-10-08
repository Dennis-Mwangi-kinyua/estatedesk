import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";
import type { AppSession } from "../../apps/web/src/lib/auth/session";
import { personalNotificationScope } from "../../apps/web/src/lib/notifications/recipient-scope";
import { collapseNotificationCopies } from "../../apps/web/src/lib/notifications/collapse-copies";

async function load<T>(entry: string, mocks: Record<string, string> = {}): Promise<T> {
  const bundle = await build({ entryPoints: [path.resolve(entry)], bundle: true, write: false,
    platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "notification-fixture", setup(builder) {
      builder.onResolve({ filter: /^server-only$/ }, () => ({ path: "empty", namespace: "fixture" }));
      builder.onResolve({ filter: /^@\// }, args => mocks[args.path] ? { path: args.path, namespace: "fixture" } : undefined);
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path] ?? "", loader: "js" }));
    } }],
  });
  const module = { exports: {} as T };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
  return module.exports;
}

test("notification fan-out excludes the actor, normalizes recipients, and prevents concurrent retries", async () => {
  const { notifyRecipients } = await load<{ notifyRecipients: (input: object) => Promise<{count: number}> }>("services/notifications/src/lib/notify.ts");
  const stored = new Map<string, {id: string; userId: string; tenantId: string | null; providerResponse: {actionUrl: string}}>();
  const db = {
    tenant: { findMany: async () => [{ id: "tenant", userId: "tenant-user" }] },
    notification: {
      findMany: async () => [],
      createMany: async ({ data, skipDuplicates }: { data: Array<{id: string; userId: string; tenantId: string | null; providerResponse: {actionUrl: string}}> ; skipDuplicates: boolean }) => {
        assert.equal(skipDuplicates, true); let count = 0;
        for (const row of data) if (!stored.has(row.id)) { stored.set(row.id, row); count++; }
        return { count };
      },
    },
  };
  const input = { db, orgId: "org", actorUserId: "actor", eventKey: "issue:123:created", channels: ["IN_APP", "WEB_PUSH"], type: "ISSUE_CREATED", title: "New issue", message: "Review", actionUrl: "/dashboard/org/issues",
    recipients: [{ userId: "actor" }, { tenantId: "tenant" }, { userId: "tenant-user" }, { userId: "tenant-user", tenantId: "tenant" }, { userId: "reviewer", tenantId: "tenant" }] };
  const results = await Promise.all([notifyRecipients(input), notifyRecipients(input)]);
  assert.equal(results.reduce((n,r) => n+r.count,0), 4);
  assert.equal(stored.size, 4);
  for (const row of stored.values()) {
    assert.notEqual(row.userId, "actor");
    if (row.userId === "reviewer") { assert.equal(row.tenantId, null); assert.equal(row.providerResponse.actionUrl, "/dashboard/org/issues"); }
    else { assert.equal(row.tenantId, "tenant"); assert.equal(row.providerResponse.actionUrl, "/dashboard/tenant/issues"); }
  }
});

test("duplicate suppression also checks the rolling window across time buckets", async () => {
  const { notifyRecipients } = await load<{ notifyRecipients: (input: object) => Promise<{count: number}> }>("services/notifications/src/lib/notify.ts");
  let created = false;
  const db = { tenant: { findMany: async () => [] }, notification: {
    findMany: async () => [{ userId: "user", tenantId: null, channel: "IN_APP" }],
    createMany: async () => { created = true; return { count: 1 }; },
  } };
  assert.deepEqual(await notifyRecipients({ db, orgId: "org", recipients: [{userId: "user"}], channels: ["IN_APP"], type: "GENERAL", title: "Update", message: "Repeated" }), {count: 0});
  assert.equal(created, false);
});

test("legacy copies collapse while later reminders remain visible", () => {
  const row = { type: "GENERAL", title: "Rent", message: "Due" };
  const rows = [0, 1000, 700000].map((offset, id) => ({...row, id, createdAt: new Date(1_000_000 - offset)}));
  assert.deepEqual(collapseNotificationCopies(rows).map(row => row.id), [0,2]);
  const scope = personalNotificationScope({userId: "user", tenantId: "tenant"});
  assert.ok(scope.OR);
  assert.equal(scope.OR.some(recipient => recipient.userId === "staff"), false);
});

test("view acknowledges only owned copies, leaves delivery status alone, and returns a tenant-safe URL", async () => {
  const state: { db?: object } = {};
  (globalThis as typeof globalThis & {notificationFixture?: object}).notificationFixture = state;
  const calls: Array<{where: object; data: object}> = [];
  const notification = { id: "notification", type: "PAYMENT_VERIFIED", title: "Paid", message: "Confirmed", createdAt: new Date(), providerResponse: {actionUrl: "/dashboard/org/payments"} };
  state.db = { tenant: {findFirst: async () => ({id: "tenant"})}, notification: {
    findFirst: async ({where}: {where: {id: string; orgId: string; OR: object[]}}) => { assert.equal(where.orgId, "org"); assert.deepEqual(where.OR, personalNotificationScope({userId: "user", tenantId: "tenant"}).OR); return where.id === "notification" ? notification : null; },
    updateMany: async (args: {where: object; data: object}) => {calls.push(args); return {count: 2};},
  } };
  const { readPersonalNotification } = await load<{readPersonalNotification: (session: AppSession, id: string) => Promise<string>}>("apps/web/src/lib/notifications/read.ts", {"@/lib/prisma": "export const prisma = globalThis.notificationFixture.db;"});
  const session = {userId: "user", activeOrgId: "org", activeOrgRole: "TENANT"} as AppSession;
  assert.equal(await readPersonalNotification(session, "notification"), "/dashboard/tenant/payments");
  assert.equal(calls.length, 1); assert.deepEqual(Object.keys(calls[0].data), ["readAt"]);
  await assert.rejects(readPersonalNotification(session, "someone-elses-notification"), /not found/);
  assert.equal(calls.length, 1);
  delete (globalThis as typeof globalThis & {notificationFixture?: object}).notificationFixture;
});

test("overlapping dispatch workers claim each delivery once and preserve the stored link", async () => {
  let claimed = false; let sends = 0; let saved: {providerResponse?: {actionUrl?: string}} = {};
  const row = {id: "push", orgId: "org", userId: "user", tenantId: null, channel: "WEB_PUSH", title: "Update", message: "Review", type: "GENERAL", providerResponse: {actionUrl: "/dashboard/tenant/notifications"}, user: {id: "user"}, tenant: null};
  const state = { db: {
    notification: {findMany: async () => [row], updateMany: async () => {if(claimed) return {count: 0}; claimed=true; return {count: 1};}, update: async ({data}: {data: typeof saved}) => {saved=data;}},
    pushSubscription: {findMany: async () => [{endpoint: "https://push.invalid",p256dh: "key",auth: "auth"}]},
  }, send: async () => {sends++;} };
  (globalThis as typeof globalThis & {dispatchFixture?: object}).dispatchFixture = state;
  const {dispatchQueuedNotifications} = await load<{dispatchQueuedNotifications: () => Promise<{sent: number}>}>("services/notifications/src/lib/dispatch.ts", {
    "@/lib/prisma": "export const prisma = globalThis.dispatchFixture.db;",
    "@/lib/push/web-push": "export const sendWebPushNotification = globalThis.dispatchFixture.send;",
    "@/lib/whatsapp/meta": "export const sendMetaWhatsappText = async () => {};",
    "@/lib/errors/server-error-log": "export const logServerError = () => {};",
    "@/lib/errors/client-safe-error": "export const safeClientMessage = () => 'Failed';",
  });
  // The audience resolver reads membership for user recipients.
  Object.assign(state.db, {membership: {findFirst: async () => ({role: "TENANT"})}});
  const results = await Promise.all([dispatchQueuedNotifications(),dispatchQueuedNotifications()]);
  assert.equal(sends,1); assert.equal(results.reduce((n,r) => n+r.sent,0),1);
  assert.equal(saved.providerResponse?.actionUrl, "/dashboard/tenant/notifications");
  delete (globalThis as typeof globalThis & {dispatchFixture?: object}).dispatchFixture;
});
