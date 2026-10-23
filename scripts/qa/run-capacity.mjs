import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { Client } from "pg";
import { createServer, request as proxyRequest } from "node:http";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");
const db = new URL(process.env.TEST_DATABASE_URL ?? "");
if (!["127.0.0.1", "localhost", "[::1]"].includes(db.hostname) || !/test/i.test(db.pathname)) throw new Error("Use a disposable local TEST_DATABASE_URL.");
const sessions = JSON.parse(await readFile(process.env.LOAD_SESSIONS_FILE, "utf8"));
const stages = (process.env.CAPACITY_STAGES ?? "1000,2000,5000").split(",").map(Number);
if (stages.some(n => !Number.isInteger(n) || n < 1000 || n > sessions.length)) throw new Error("Each capacity stage must have at least 1,000 available sessions.");
const duration = Number(process.env.CAPACITY_DURATION_SECONDS ?? 600);
if (!Number.isFinite(duration) || duration < 10) throw new Error("Use at least ten seconds per capacity stage.");
const requestsPerUserPerMinute = Number(process.env.CAPACITY_REQUESTS_PER_USER_PER_MINUTE ?? 6);
if (!Number.isFinite(requestsPerUserPerMinute) || requestsPerUserPerMinute <= 0 || requestsPerUserPerMinute > 120) throw new Error("Invalid per-user activity rate.");
if (!process.env.AUTH_SECRET) throw new Error("Provide the same isolated AUTH_SECRET used for seeding.");
const port = Number(process.env.CAPACITY_PORT ?? 3158);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid local server port.");
const base = `http://127.0.0.1:${port}`;
const instanceCount = Number(process.env.CAPACITY_INSTANCES ?? 1);
if (!Number.isInteger(instanceCount) || instanceCount < 1 || instanceCount > 8 || port + instanceCount > 65535) throw new Error("Use between one and eight local application instances.");
const folder = await mkdtemp(join(tmpdir(), "estatedesk-capacity-run-"));
const env = { ...process.env, DOTENV_CONFIG_PATH: "/dev/null", NODE_ENV: "production", DATABASE_URL: db.href, DIRECT_URL: db.href, REALTIME_DATABASE_URL: db.href, APP_URL: base, NEXT_PUBLIC_APP_URL: base };
const log = createWriteStream(join(folder, "server.log"), { mode: 0o600 });
const servers = Array.from({ length: instanceCount }, (_, i) => {
  const child = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port + i + 1)], { cwd: join(root, "apps/web"), env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
  return child;
});
let nextInstance = 0;
const proxy = createServer((incoming, outgoing) => {
  const targetPort = port + 1 + (nextInstance++ % instanceCount);
  const upstream = proxyRequest({ hostname: "127.0.0.1", port: targetPort, path: incoming.url, method: incoming.method, headers: incoming.headers }, response => {
    outgoing.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(outgoing);
  });
  upstream.on("error", () => { if (!outgoing.headersSent) outgoing.writeHead(502); outgoing.end(); });
  incoming.on("aborted", () => upstream.destroy());
  incoming.pipe(upstream);
});
const monitor = new Client({ connectionString: db.href, connectionTimeoutMillis: 5000 });
const results = [];
let timer;
let sampling = false;
let monitoringErrors = 0;
let metrics = { maxConnections: 0, maxActiveQueries: 0, minRssKiB: Infinity, maxRssKiB: 0 };
try {
  await new Promise((accept, reject) => { proxy.once("error", reject); proxy.listen(port, "127.0.0.1", accept); });
  await monitor.connect();
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (servers.some(server => server.exitCode !== null)) throw new Error("Local server exited; inspect the private server log.");
    try { ready = (await Promise.all(servers.map((_, i) => fetch(`http://127.0.0.1:${port + i + 1}/login`, { signal: AbortSignal.timeout(5000) })))).every(response => response.ok); } catch {}
    if (ready) break;
    await sleep(1000);
  }
  if (!ready) throw new Error("Local production server did not become ready.");
  timer = setInterval(async () => {
    if (sampling) return;
    sampling = true;
    try {
      const { rows } = await monitor.query("SELECT count(*)::int AS connections, count(*) FILTER (WHERE state = 'active' AND pid <> pg_backend_pid())::int AS active FROM pg_stat_activity WHERE datname = current_database()");
      const { stdout } = await run("ps", ["-o", "rss=", "-p", servers.map(server => server.pid).join(",")]);
      const rss = stdout.trim().split(/\s+/).reduce((sum, value) => sum + Number(value), 0);
      metrics.maxConnections = Math.max(metrics.maxConnections, rows[0].connections);
      metrics.maxActiveQueries = Math.max(metrics.maxActiveQueries, rows[0].active);
      metrics.minRssKiB = Math.min(metrics.minRssKiB, rss);
      metrics.maxRssKiB = Math.max(metrics.maxRssKiB, rss);
    } catch { monitoringErrors++; } finally { sampling = false; }
  }, 1000);
  const routes = join(folder, "routes.json");
  await writeFile(routes, process.env.CAPACITY_SERVICE_SCOPE === "all"
    ? await readFile(join(root, "scripts/load-test-routes.all-services.json"), "utf8")
    : JSON.stringify([
    { path: "/dashboard/org", weight: 3 }, { path: "/dashboard/org/units", weight: 2 },
    { path: "/dashboard/org/tenants", weight: 2 }, { path: "/dashboard/org/payments", weight: 2 },
    { path: "/dashboard/org/issues", weight: 1 },
  ]));
  for (const count of [50, ...stages]) {
    const fixture = join(folder, `sessions-${count}.json`);
    const output = join(folder, `report-${count}.json`);
    await writeFile(fixture, JSON.stringify(sessions.slice(0, count)), { mode: 0o600 });
    metrics = { maxConnections: 0, maxActiveQueries: 0, minRssKiB: Infinity, maxRssKiB: 0 };
    let passed = true;
    try {
      await run(process.execPath, ["scripts/load-test.mjs"], { cwd: root, env: { ...env, LOAD_BASE_URL: base, LOAD_SESSIONS_FILE: fixture, LOAD_ROUTES_FILE: routes, LOAD_OUTPUT: output, LOAD_PROFILE: count === 50 ? "smoke" : "users1000", LOAD_DURATION_SECONDS: String(count === 50 ? 10 : duration), LOAD_RPM: String(count === 50 ? 300 : count * requestsPerUserPerMinute), LOAD_CONCURRENCY: String(count === 50 ? 4 : 100), LOAD_FAIL_ON_ERROR_RATE: "1", LOAD_FAIL_ON_P95_MS: "1500", LOAD_FAIL_ON_SCHEDULING_P95_MS: "1000", LOAD_FAIL_ON_ROUTE_P95_MS: "1500", LOAD_MIN_REQUESTS_PER_ROUTE: count === 50 ? "" : "10" }, maxBuffer: 2_000_000, timeout: (duration + 120) * 1000 });
    } catch { passed = false; }
    let report;
    try { report = JSON.parse(await readFile(output, "utf8")); }
    catch { passed = false; report = { summary: { abortReason: "Load process failed or timed out before writing a final report; throughput is unverified." } }; }
    if (monitoringErrors) passed = false;
    results.push({ users: count, passed, ...report.summary, monitoringErrors, processMetrics: { ...metrics, minRssKiB: Number.isFinite(metrics.minRssKiB) ? metrics.minRssKiB : null } });
    console.log(JSON.stringify({ users: count, passed, summary: report.summary, processMetrics: metrics }));
    if (!passed) { process.exitCode = 1; break; }
  }
} finally {
  clearInterval(timer);
  proxy.closeAllConnections(); proxy.close();
  for (const server of servers) server.kill("SIGTERM");
  await monitor.end();
  const output = process.env.CAPACITY_REPORT ?? join(folder, "summary.json");
  await writeFile(output, JSON.stringify({ environment: "Local production-build processes and isolated local PostgreSQL; not deployed-hosting capacity evidence.", instanceCount, requestsPerUserPerMinute, durationSecondsPerStage: duration, results }, null, 2));
  console.log(`Sanitized capacity report: ${output}`);
}
