import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { configureTestDatabase } from "./database-safety";

const url = configureTestDatabase();
test("realtime signals commit atomically, deduplicate scopes, and ignore read-side writes", { skip: !url }, async () => {
  const writer = new Client({ connectionString: url });
  const listener = new Client({ connectionString: url });
  const schema = `realtime_test_${randomUUID().replaceAll("-", "")}`;
  const events: string[] = [];
  try {
    await writer.connect(); await listener.connect();
    await writer.query(`CREATE SCHEMA ${schema}`);
    await writer.query(`SET search_path TO ${schema}`);
    await writer.query('CREATE TABLE "Unit" (id text PRIMARY KEY, "orgId" text, name text, "lastSeenAt" timestamp, "updatedAt" timestamp)');
    await writer.query('CREATE TABLE "AuditLog" (id text, "orgId" text)');
    await writer.query('CREATE TABLE "ServiceProvider" (id text, "userId" text)');
    await writer.query('CREATE TABLE "ServiceJob" (id text, "orgId" text, "providerId" text)');
    await writer.query('CREATE TABLE "JobApplication" (id text, "jobId" text, "providerId" text)');
    await writer.query('CREATE VIEW "RegisteredIdentityOwners" AS SELECT id, "orgId" FROM "Unit"');
    await writer.query(await readFile("prisma/migrations/20261022140000_workspace_realtime_signals/migration.sql", "utf8"));
    listener.on("notification", message => { if (message.payload) events.push(message.payload); });
    await listener.query("LISTEN estatedesk_workspace");
    const settle = () => new Promise(resolve => setTimeout(resolve, 100));
    await writer.query("BEGIN");
    await writer.query('INSERT INTO "Unit" (id, "orgId", name) VALUES ($1, $2, $3)', ["unit", "org-a", "Private name"]);
    await settle(); assert.deepEqual(events, []);
    await writer.query("ROLLBACK"); await settle(); assert.deepEqual(events, []);
    await writer.query("BEGIN");
    await writer.query('INSERT INTO "Unit" (id, "orgId", name) VALUES ($1, $2, $3)', ["unit", "org-a", "Private name"]);
    await writer.query('UPDATE "Unit" SET name = $1', ["Other private name"]);
    await writer.query("COMMIT"); await settle();
    assert.deepEqual([...events].sort(), ["org:org-a", "platform"]);
    events.length = 0;
    await writer.query('UPDATE "Unit" SET "lastSeenAt" = now(), "updatedAt" = now()');
    await writer.query('INSERT INTO "AuditLog" VALUES ($1, $2)', ["view", "org-a"]);
    await settle(); assert.deepEqual(events, []);
    await writer.query('UPDATE "Unit" SET "orgId" = $1', ["org-b"]); await settle();
    assert.deepEqual([...events].sort(), ["org:org-a", "org:org-b", "platform"]);
    events.length = 0;
    await writer.query('DELETE FROM "Unit"'); await settle();
    assert.deepEqual([...events].sort(), ["org:org-b", "platform"]);
    await writer.query('INSERT INTO "ServiceProvider" VALUES ($1, $2)', ["provider", "provider-user"]);
    await writer.query('INSERT INTO "ServiceJob" VALUES ($1, $2, $3)', ["job", "org-a", "provider"]);
    await settle(); events.length = 0;
    await writer.query('INSERT INTO "JobApplication" VALUES ($1, $2, $3)', ["application", "job", "provider"]);
    await settle();
    assert.deepEqual([...events].sort(), ["org:org-a", "platform", "user:provider-user"]);
  } finally {
    await writer.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(() => {});
    await Promise.allSettled([writer.end(), listener.end()]);
  }
});
