import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { configureTestDatabase } from "./database-safety";

const url = configureTestDatabase();
test("payment reversal migration supports original and already-expanded schemas without losing records", { skip: !url }, async () => {
  const db = new Client({ connectionString: url });
  await db.connect();
  const migration = await readFile("prisma/migrations/20261022150000_reconcile_payment_reversal_history/migration.sql", "utf8");
  try {
    for (const expanded of [false, true]) {
      const schema = `reversal_test_${randomUUID().replaceAll("-", "")}`;
      await db.query(`CREATE SCHEMA ${schema}`);
      try {
        await db.query(`SET search_path TO ${schema}`);
        await db.query('CREATE TYPE "VerificationStatus" AS ENUM (\'VERIFIED\')');
        await db.query('CREATE TABLE "User" (id text PRIMARY KEY)');
        await db.query('CREATE TABLE "Payment" (id text PRIMARY KEY, amount numeric NOT NULL)');
        await db.query('INSERT INTO "User" VALUES (\'operator\')');
        await db.query('INSERT INTO "Payment" VALUES (\'payment\', 123.45)');
        if (expanded) {
          await db.query(migration);
          await db.query('UPDATE "Payment" SET "reversedAt" = \'2026-10-01\', "reversedByUserId" = \'operator\', "reversalReason" = \'Existing reversal\'');
        }
        await db.query(migration);
        await db.query(migration);
        const { rows } = await db.query('SELECT amount::text, "reversedAt", "reversalReason" FROM "Payment"');
        assert.equal(rows.length, 1);
        assert.equal(rows[0].amount, "123.45");
        assert.equal(rows[0].reversalReason, expanded ? "Existing reversal" : null);
        await assert.rejects(db.query('UPDATE "Payment" SET "reversedByUserId" = \'missing\''), /foreign key/);
        await db.query('DELETE FROM "User"');
        assert.equal((await db.query('SELECT "reversedByUserId" FROM "Payment"')).rows[0].reversedByUserId, null);
      } finally {
        await db.query("SET search_path TO public");
        await db.query(`DROP SCHEMA ${schema} CASCADE`);
      }
    }
  } finally { await db.end(); }
});
