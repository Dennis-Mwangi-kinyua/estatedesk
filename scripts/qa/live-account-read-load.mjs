/** Authorized single-account HTTP throughput probe; preserves all other sessions. */
import { config } from "dotenv";
import pg from "pg";
import { randomBytes, randomUUID, createHmac } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

if (process.env.LIVE_ACCOUNT_READ_LOAD !== "authorized") throw new Error("Explicit live-account load authorization is required.");
for (const path of [".env.local", ".env", "apps/web/.env.local", "apps/web/.env"]) config({ path, quiet: true });
const email = process.env.LOAD_TEST_ACCOUNT_EMAIL;
if (!email || !process.env.AUTH_SECRET) throw new Error("Provide the designated account and configured signing secret.");
const concurrency = Number(process.env.LIVE_READ_CONCURRENCY ?? 16);
const stages = (process.env.LIVE_READ_STAGE_RPMS ?? "60,300,1000,2000,6000").split(",").map(Number);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32
  || !stages.length || stages.length > 5 || stages.some(rpm => !Number.isInteger(rpm) || rpm < 1 || rpm > 6000)) {
  throw new Error("Use at most five stages of 1–6,000 RPM and 1–32 concurrent requests.");
}
const base = new URL(process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL);
if (base.protocol !== "https:" || base.username || base.password) throw new Error("Use the configured HTTPS app origin.");
const database = new URL(process.env.DATABASE_URL);
if (database.searchParams.get("sslmode") === "require") database.searchParams.set("sslmode", "verify-full");
const client = new pg.Client({ connectionString: database.href, connectionTimeoutMillis: 10000, statement_timeout: 5000 });
const directory = await mkdtemp(join(tmpdir(), "estatedesk-live-account-read-"));
const sessionId = `capacity-${randomUUID()}`;
const token = randomBytes(32).toString("hex");
const tokenHash = createHmac("sha256", process.env.AUTH_SECRET).update("session\0").update(token).digest("hex");
const mac = createHmac("sha256", process.env.AUTH_SECRET.trim()).update("session-cookie\0").update(token).digest("hex").slice(0, 32);
const cookie = `__Host-estatedesk_session=v1.${token}.${mac}`;
const run = promisify(execFile);
const report = { checkedAt: new Date().toISOString(), origin: base.origin,
  method: `One designated account, sequential 30-second GET-only stages, at most ${concurrency} in-flight requests; abort on 1% errors or p95 above 1.5 seconds. No customer business records are created or changed by this runner. Normal page handlers may maintain session presence and rate-limit records.`,
  limitations: "Single-account throughput only; does not verify 1,000 distinct users, password verification, browser assets or write workflows.",
  testSessionRemoved: false, results: [] };
let created = false;
let connected = false;
try {
  await client.connect(); connected = true;
  await client.query("BEGIN");
  const { rows: users } = await client.query('SELECT id,status,"deletedAt","mustChangePassword","termsAcceptedAt","twoFactorEnabled" FROM "User" WHERE lower(email)=lower($1)', [email]);
  const user = users[0];
  if (users.length !== 1 || user.status !== "ACTIVE" || user.deletedAt || user.mustChangePassword || !user.termsAcceptedAt || user.twoFactorEnabled) throw new Error("Designated account is unavailable or requires an interactive security step.");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [user.id]);
  const { rows: count } = await client.query('SELECT count(*)::int AS count FROM "UserSession" WHERE "userId"=$1 AND "expiresAt">now()', [user.id]);
  if (count[0].count >= 2) throw new Error("Both session slots remain occupied; no existing session was revoked by the test runner.");
  const { rows: memberships } = await client.query('SELECT m.id,m.role FROM "Membership" m JOIN "Organization" o ON o.id=m."orgId" WHERE m."userId"=$1 AND m."deactivatedAt" IS NULL AND m."employmentEndedAt" IS NULL AND o."deletedAt" IS NULL AND o.status=\'ACTIVE\' ORDER BY m."createdAt" LIMIT 1', [user.id]);
  const membership = memberships[0];
  if (!membership || !["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "TENANT"].includes(membership.role)) throw new Error("Designated account has no supported active test workspace.");
  report.role = membership.role;
  await client.query('INSERT INTO "UserSession" (id,"userId","tokenHash","expiresAt","activeMembershipId","userAgent") VALUES ($1,$2,$3,now()+interval \'20 minutes\',$4,$5)', [sessionId, user.id, tokenHash, membership.id, "EstateDeskLoadTest/1.0 session/1"]);
  created = true;
  await client.query("COMMIT");
  // Retain a non-secret recovery identifier if the process is interrupted.
  await writeFile(join(directory, "cleanup.json"), JSON.stringify({ sessionId }), { mode: 0o600 });
  const paths = membership.role === "TENANT"
    ? ["/dashboard/tenant", "/dashboard/tenant/documents", "/dashboard/tenant/payments"]
    : ["/dashboard/org/units", "/dashboard/org/properties", "/dashboard/org/payments"];
  for (const path of paths) {
    const response = await fetch(new URL(path, base), { headers: { cookie, "user-agent": "EstateDeskLoadTest/1.0 session/1" }, redirect: "manual", signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    if (response.status !== 200 || /<meta id="__next-page-redirect"|NEXT_HTTP_ERROR_FALLBACK|Application error: a server-side exception/.test(body)) {
      report.warmupFailure = { path, status: response.status };
      throw new Error("Authenticated warmup did not serve the intended page.");
    }
  }
  const routes = join(directory, "routes.json");
  await writeFile(routes, JSON.stringify(paths.map(path => ({ path, expectedStatus: [200] }))));
  for (const rpm of stages) {
    const output = join(directory, `stage-${rpm}.json`);
    let passed = true;
    try {
      await run(process.execPath, [resolve("scripts/load-test.mjs")], { timeout: 60000, maxBuffer: 1_000_000,
        env: { ...process.env, LOAD_BASE_URL: base.origin, LOAD_ROUTES_FILE: routes, LOAD_OUTPUT: output,
          LOAD_PROFILE: "smoke", LOAD_SESSIONS_FILE: "", LOAD_COOKIE_HEADER: cookie, LOAD_SESSION_COOKIE: "",
          LOAD_RPM: String(rpm), LOAD_DURATION_SECONDS: "30", LOAD_CONCURRENCY: String(concurrency), LOAD_REQUEST_TIMEOUT_MS: "10000",
          LOAD_FAIL_ON_ERROR_RATE: "1", LOAD_FAIL_ON_P95_MS: "1500", LOAD_FAIL_ON_SCHEDULING_P95_MS: "1000", LOAD_ABORT_AFTER_REQUESTS: "10" } });
    } catch { passed = false; }
    let summary;
    try { summary = JSON.parse(await readFile(output, "utf8")).summary; }
    catch { passed = false; summary = { abortReason: "No final load report produced." }; }
    report.results.push({ offeredRpm: rpm, passed, ...summary });
    console.log(JSON.stringify({ rpm, passed, completed: summary.completed, p95: summary.latency?.p95, abortReason: summary.abortReason }));
    if (!passed) { process.exitCode = 1; break; }
  }
} catch (error) {
  if (connected) await client.query("ROLLBACK").catch(() => {});
  // Messages above are fixed text and contain no account details or secrets.
  report.failure = error.code ? `Live account probe failed (${error.code}).` : error.message;
  process.exitCode = 1;
} finally {
  if (created) {
    try {
      await client.query('DELETE FROM "UserSession" WHERE id=$1 AND "tokenHash"=$2', [sessionId, tokenHash]);
      report.testSessionRemoved = true;
    } catch { report.cleanupFailure = "Temporary test session must be revoked using the private cleanup identifier."; process.exitCode = 1; }
  }
  await client.end();
  const output = join(directory, "summary.json");
  await writeFile(output, JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(`Sanitized live account read report: ${output}`);
}
