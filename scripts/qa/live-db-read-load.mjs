/** Explicitly authorized, bounded read-only DB probe; not an authenticated app benchmark. */
import { config } from "dotenv";
import pg from "pg";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

if (process.env.LIVE_DB_READ_LOAD !== "authorized") throw new Error("Explicit live-database load authorization is required.");
for (const path of [".env.local", ".env", "apps/web/.env.local", "apps/web/.env"]) config({ path, quiet: true });
const database = new URL(process.env.DATABASE_URL);
if (database.searchParams.get("sslmode") === "require") database.searchParams.set("sslmode", "verify-full");
const pool = new pg.Pool({ connectionString: database.href, max: 5, connectionTimeoutMillis: 5000,
  statement_timeout: 3000, query_timeout: 5000, idleTimeoutMillis: 10000,
  options: "-c default_transaction_read_only=on" });
let poolErrors = 0;
pool.on("error", () => { poolErrors++; });
const directory = await mkdtemp(join(tmpdir(), "estatedesk-live-db-read-"));
const results = [];
const run = promisify(execFile);
let server;
let maxWaiting = 0;
const report = { checkedAt: new Date().toISOString(),
  environment: "Live database reached from the local test client, five database connections maximum.",
  limitations: "Read-only SQL over existing organization records; no authenticated HTTP sessions, browser rendering, write workflows, or 1,000 distinct users. RPM counts SQL workload operations, not website requests.",
  readOnlyVerified: false, results };
try {
  // Establish every bounded pool connection before measuring steady-state reads.
  // Holding all clients until verification completes prevents reusing one socket.
  const connectedAt = performance.now();
  const connections = await Promise.allSettled(Array.from({ length: 5 }, () => pool.connect()));
  const clients = connections.filter(result => result.status === "fulfilled").map(result => result.value);
  try {
    if (clients.length !== 5) throw new Error("Unable to establish the bounded read-only pool.");
    const settings = await Promise.all(clients.map(client => client.query("SHOW default_transaction_read_only")));
    if (settings.some(result => result.rows[0].default_transaction_read_only !== "on")) throw new Error("Read-only connection verification failed.");
  } finally {
    for (const client of clients) client.release();
  }
  report.poolWarmupMs = Math.round(performance.now() - connectedAt);
  report.readOnlyVerified = true;
  const { rows: organizations } = await pool.query('SELECT id FROM "Organization" WHERE "deletedAt" IS NULL ORDER BY id LIMIT 100');
  if (!organizations.length) throw new Error("No existing organizations to exercise.");
  report.exercisedOrganizations = organizations.length;
  const queries = {
    "/summary": 'SELECT (SELECT count(*) FROM "Tenant" WHERE "orgId"=$1 AND "deletedAt" IS NULL) AS tenants, (SELECT count(*) FROM "Lease" WHERE "orgId"=$1 AND "deletedAt" IS NULL AND status=\'ACTIVE\') AS leases, (SELECT count(*) FROM "IssueTicket" WHERE "orgId"=$1 AND status IN (\'OPEN\',\'IN_PROGRESS\')) AS issues',
    "/units": 'SELECT u.id FROM "Unit" u JOIN "Property" p ON p.id=u."propertyId" WHERE p."orgId"=$1 AND p."deletedAt" IS NULL AND u."deletedAt" IS NULL ORDER BY u."createdAt" DESC LIMIT 20',
    "/leases": 'SELECT id FROM "Lease" WHERE "orgId"=$1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 20',
  };
  let next = 0;
  server = createServer(async (request, response) => {
    const query = queries[request.url];
    if (request.method !== "GET" || !query) { response.writeHead(404).end(); return; }
    try {
      maxWaiting = Math.max(maxWaiting, pool.waitingCount);
      await pool.query(query, [organizations[next++ % organizations.length].id]);
      response.writeHead(200, { "content-type": "text/plain" }).end("ok");
    } catch { response.writeHead(503).end("Read workload failed"); }
  });
  await new Promise((accept, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", accept); });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of Object.keys(queries)) {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(10000) });
    await response.text();
    if (!response.ok) throw new Error("Read workload warmup failed.");
  }
  const routes = join(directory, "routes.json");
  await writeFile(routes, JSON.stringify(Object.keys(queries).map(path => ({ path, expectedStatus: [200] }))));
  for (const rpm of [60, 300, 1000, 2000, 6000]) {
    const output = join(directory, `stage-${rpm}.json`);
    maxWaiting = 0;
    let passed = true;
    try {
      await run(process.execPath, [resolve("scripts/load-test.mjs")], { timeout: 60000, maxBuffer: 1_000_000,
        env: { ...process.env, LOAD_BASE_URL: base, LOAD_ROUTES_FILE: routes, LOAD_OUTPUT: output,
          LOAD_PROFILE: "smoke", LOAD_SESSIONS_FILE: "", LOAD_COOKIE_HEADER: "", LOAD_SESSION_COOKIE: "",
          LOAD_RPM: String(rpm), LOAD_DURATION_SECONDS: "30", LOAD_CONCURRENCY: "16",
          LOAD_REQUEST_TIMEOUT_MS: "5000", LOAD_FAIL_ON_ERROR_RATE: "1", LOAD_FAIL_ON_P95_MS: "1500",
          LOAD_FAIL_ON_SCHEDULING_P95_MS: "1000", LOAD_ABORT_AFTER_REQUESTS: "10" } });
    } catch { passed = false; }
    let summary;
    try { summary = JSON.parse(await readFile(output, "utf8")).summary; }
    catch { passed = false; summary = { abortReason: "Read workload did not produce a final report." }; }
    if (poolErrors) passed = false;
    // The HTTP adapter carries no user session; do not label its anonymous
    // load-generator slot as an exercised account in database-only evidence.
    delete summary.suppliedSessions;
    delete summary.exercisedSessions;
    results.push({ offeredOperationsPerMinute: rpm, passed, maxPoolWaiting: maxWaiting, poolErrors, ...summary });
    console.log(JSON.stringify({ rpm, passed, completed: summary.completed, p95: summary.latency?.p95, abortReason: summary.abortReason }));
    if (!passed) { process.exitCode = 1; break; }
  }
} catch (error) {
  report.failure = `Database read probe failed (${error.code ?? error.name}).`;
  process.exitCode = 1;
} finally {
  if (server) { server.closeAllConnections(); await new Promise(accept => server.close(accept)); }
  await pool.end();
  const output = join(directory, "summary.json");
  await writeFile(output, JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(`Sanitized live database read report: ${output}`);
}
