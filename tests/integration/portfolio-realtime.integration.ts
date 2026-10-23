import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { configureTestDatabase } from "./database-safety";

const url = configureTestDatabase();
test("portfolio child changes notify the owning organization only after commit", { skip: !url }, async () => {
  const writer = new Client({ connectionString: url });
  const listener = new Client({ connectionString: url });
  const schema = `portfolio_live_${randomUUID().replaceAll("-", "")}`;
  const events: string[] = [];
  const settle = () => new Promise(resolve => setTimeout(resolve, 100));
  try {
    await writer.connect(); await listener.connect();
    await writer.query(`CREATE SCHEMA ${schema}`);
    await writer.query(`SET search_path TO ${schema}`);
    await writer.query('CREATE TABLE "Property" (id text PRIMARY KEY, "orgId" text)');
    await writer.query('CREATE TABLE "Unit" (id text PRIMARY KEY, "propertyId" text, notes text, "updatedAt" timestamp)');
    await writer.query('CREATE TABLE "Building" (id text PRIMARY KEY, "propertyId" text, name text)');
    await writer.query('CREATE TABLE "MeterReading" (id text PRIMARY KEY, "unitId" text, reading int)');
    await writer.query('INSERT INTO "Property" VALUES ($1,$2),($3,$4)', ["a", "org-a", "b", "org-b"]);
    await writer.query(await readFile("prisma/migrations/20261023190000_portfolio_realtime_scopes/migration.sql", "utf8"));
    listener.on("notification", message => { if (message.payload) events.push(message.payload); });
    await listener.query("LISTEN estatedesk_workspace");
    await writer.query("BEGIN");
    await writer.query('INSERT INTO "Unit" VALUES ($1,$2,$3,now())', ["unit", "a", "private notes"]);
    await settle(); assert.deepEqual(events, []);
    await writer.query("ROLLBACK"); await settle(); assert.deepEqual(events, []);
    await writer.query('INSERT INTO "Unit" VALUES ($1,$2,$3,now())', ["unit", "a", "private notes"]);
    await settle(); assert.deepEqual(events.sort(), ["org:org-a", "platform"]);
    events.length = 0;
    await writer.query('UPDATE "Unit" SET "updatedAt" = now()');
    await settle(); assert.deepEqual(events, []);
    await writer.query('UPDATE "Unit" SET "propertyId" = $1', ["b"]);
    await settle(); assert.deepEqual(events.sort(), ["org:org-a", "org:org-b", "platform"]);
    events.length = 0;
    await writer.query('INSERT INTO "MeterReading" VALUES ($1,$2,$3)', ["meter", "unit", 12345]);
    await settle(); assert.deepEqual(events.sort(), ["org:org-b", "platform"]);
    events.length = 0;
    await writer.query('INSERT INTO "Building" VALUES ($1,$2,$3)', ["building", "a", "private name"]);
    await settle(); assert.deepEqual(events.sort(), ["org:org-a", "platform"]);
    events.length = 0;
    await writer.query('DELETE FROM "Unit"');
    await settle(); assert.deepEqual(events.sort(), ["org:org-b", "platform"]);
  } finally {
    await writer.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(() => {});
    await Promise.allSettled([writer.end(), listener.end()]);
  }
});
