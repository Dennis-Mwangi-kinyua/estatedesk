import { resolve } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import dns from "node:dns";
import nextEnv from "@next/env";
import { config } from "dotenv";
import pg from "pg";
import { Prisma } from "@prisma/client";
import { getDatabaseUrl } from "../packages/config/src/env.ts";

// Match Next's app environment, then fill missing values from the repo root.
dns.setDefaultResultOrder("ipv4first");
nextEnv.loadEnvConfig(resolve("apps/web"), process.env.NODE_ENV !== "production");
config({ path: resolve(".env"), quiet: true });

const client = new pg.Client({
  connectionString: getDatabaseUrl(),
  connectionTimeoutMillis: 10_000,
  query_timeout: 10_000,
});

try {
  const started = performance.now();
  await client.connect();
  const connected = performance.now();
  await client.query("SELECT 1");
  console.log(JSON.stringify({ connected: true, connectMs: Math.round(connected - started), queryMs: Math.round(performance.now() - connected) }));

  const { rows } = await client.query<{ table_name: string; column_name: string }>(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = current_schema()",
  );
  const columns = new Set(rows.map(row => `${row.table_name}.${row.column_name}`));
  const missing = Prisma.dmmf.datamodel.models.flatMap(model => model.fields
    .filter(field => field.kind !== "object" && !columns.has(`${model.dbName ?? model.name}.${field.dbName ?? field.name}`))
    .map(field => `${model.dbName ?? model.name}.${field.dbName ?? field.name}`));
  console.log(JSON.stringify({ schemaMatchesClient: missing.length === 0, missingColumns: missing }));

  if (rows.some(row => row.table_name === "_prisma_migrations")) {
    const { rows: migrations } = await client.query<{ migration_name: string; checksum: string; finished_at: Date | null; rolled_back_at: Date | null }>(
      'SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"',
    );
    const applied = new Map(migrations.filter(row => row.finished_at && !row.rolled_back_at).map(row => [row.migration_name, row.checksum]));
    const local = (await readdir(resolve("prisma/migrations"), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name);
    const pending = local.filter(name => !applied.has(name)).sort();
    const modified = [];
    for (const name of local.filter(name => applied.has(name))) {
      const checksum = createHash("sha256").update(await readFile(resolve("prisma/migrations", name, "migration.sql"))).digest("hex");
      if (checksum !== applied.get(name)) modified.push(name);
    }
    const unfinished = migrations.filter(row => !row.finished_at && !row.rolled_back_at).map(row => row.migration_name);
    console.log(JSON.stringify({ pendingMigrations: pending, modifiedMigrations: modified.sort(), unfinishedMigrations: unfinished }));
    if (pending.length || modified.length || unfinished.length) process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ migrationHistoryPresent: false }));
    process.exitCode = 1;
  }
  if (missing.length) process.exitCode = 1;
} catch (error) {
  // Never print connection URLs, database error messages, stacks or row data.
  const value = error as { name?: string; code?: string; cause?: { code?: string } };
  console.error(JSON.stringify({ connected: false, name: value.name, code: value.code, causeCode: value.cause?.code }));
  process.exitCode = 1;
} finally {
  await client.end();
}
