import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { Client } from "pg";
import { config } from "dotenv";
import { root, protocolVersion, sourceFingerprint, releaseStampPath } from "./lib/workflow-release.mjs";

config({ path: [path.join(root, "apps/web/.env.local"), path.join(root, "apps/web/.env"), path.join(root, ".env")], quiet: true });
const artifactsOnly = process.argv.includes("--artifacts-only");
const originArg = process.argv.find(value => value.startsWith("--origin="))?.slice("--origin=".length);
const failures = [];
for (const kind of ["web", "mobile"]) {
  try {
    const stamp = JSON.parse(readFileSync(releaseStampPath(kind), "utf8"));
    if (stamp.protocolVersion !== protocolVersion || stamp.sourceFingerprint !== sourceFingerprint(kind)) throw new Error("source or protocol changed since build");
    console.log(`PASS ${kind} artifact matches current source and protocol ${protocolVersion}`);
  } catch { failures.push(`${kind} artifact missing or stale; run ${kind === "web" ? "npm run build" : "npm run mobile:bundle"}`); }
}
const routes = spawnSync(process.execPath, [path.join(root, "scripts/check-mobile-deployment.mjs")], { cwd: root, stdio: "inherit" });
if (routes.status !== 0) failures.push("Mobile backend routes are missing from the web artifact");
if (!artifactsOnly) {
  let client;
  try {
    const raw = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!raw) throw new Error("database is not configured");
    const url = new URL(raw);
    if (["prefer", "require", "verify-ca"].includes(url.searchParams.get("sslmode"))) { url.searchParams.delete("uselibpqcompat"); url.searchParams.set("sslmode", "verify-full"); }
    client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000, query_timeout: 10000 });
    await client.connect();
    const { rows } = await client.query('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"');
    const completed = new Map(rows.filter(row => row.finished_at && !row.rolled_back_at).map(row => [row.migration_name, row.checksum]));
    const pending = [];
    for (const entry of readdirSync(path.join(root, "prisma/migrations"), { withFileTypes: true }).filter(entry => entry.isDirectory())) {
      const checksum = createHash("sha256").update(readFileSync(path.join(root, "prisma/migrations", entry.name, "migration.sql"))).digest("hex");
      if (completed.get(entry.name) !== checksum) pending.push(entry.name);
    }
    if (pending.length || rows.some(row => !row.finished_at && !row.rolled_back_at)) failures.push(`Database migrations pending, modified or unfinished: ${pending.join(", ")}`);
    else console.log(`PASS ${completed.size} applied database migrations match source`);
  } catch { failures.push("Database migration verification failed; check database access and migration history"); }
  finally { await client?.end().catch(() => {}); }
} else console.log("Database NOT checked (--artifacts-only); this is not a complete release check.");

if (originArg) {
  const origin = new URL(originArg);
  if (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)) || origin.pathname !== "/" || origin.username || origin.password || origin.search || origin.hash) throw new Error("Provide an HTTPS origin without credentials, path or query");
  try {
    const response = await fetch(new URL("/api/mobile/capabilities", origin), { signal: AbortSignal.timeout(15000), redirect: "error" });
    const capabilities = await response.json();
    if (!response.ok || capabilities.workflowVersion !== protocolVersion) throw new Error("Protocol mismatch");
    const live = spawnSync(process.execPath, [path.join(root, "scripts/check-live-mobile-services.mjs"), origin.origin], { cwd: root, stdio: "inherit" });
    if (live.status !== 0) throw new Error("Live routes missing");
    console.log("PASS deployed mobile protocol and route availability");
  } catch { failures.push("Deployed backend routes or workflow protocol do not match this app"); }
} else console.log("Deployed backend NOT checked. Add --origin=https://your-server to verify the release target.");
if (failures.length) { for (const failure of failures) console.error(`FAIL ${failure}`); process.exitCode = 1; }
else console.log("Selected release checks passed. Signed-in device smoke tests remain a release step.");
