/** Read-only load against seeded, disposable local workspaces. No production targets. */
import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const base = new URL(process.env.AUDIT_BASE_URL || "http://127.0.0.1:3107");
if (!["127.0.0.1", "localhost"].includes(base.hostname)) throw new Error("Capacity smoke only permits disposable localhost servers.");
const fixture = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE || "/tmp/estatedesk-capacity-roles.json", "utf8"));
const results = [];
const profiles = [
  { name: "public", paths: ["/", "/services", "/pricing"], rpm: 1200, duration: 15, concurrency: 8 },
  { name: "ADMIN", paths: ["/dashboard/org", "/dashboard/org/properties", "/dashboard/org/units"], rpm: 600, duration: 15, concurrency: 8 },
  { name: "ADMIN1800", role: "ADMIN", paths: ["/dashboard/org", "/dashboard/org/properties", "/dashboard/org/units"], rpm: 1800, duration: 15, concurrency: 16 },
  { name: "TENANT", paths: [fixture.accounts.TENANT.home], rpm: 600, duration: 15, concurrency: 8 },
];
for (const profile of profiles) {
  if (profile.name === "ADMIN1800" && results.some(result => !result.passed)) continue;
  let cookie = "";
  if (profile.name !== "public") {
    const state = JSON.parse(await readFile(`/tmp/estatedesk-role-state-${profile.role || profile.name}.json`, "utf8"));
    cookie = state.cookies.map(item => `${item.name}=${item.value}`).join("; ");
  }
  const routeFile = `/tmp/estatedesk-capacity-routes-${profile.name}.json`;
  await writeFile(routeFile, JSON.stringify(profile.paths.map(path => ({ path, method: "GET", expectedStatus: [200] }))));
  // Warm routes before the timed sample; redirects cannot be mistaken for protected content.
  for (const path of profile.paths) {
    const response = await fetch(new URL(path, base), { headers: { cookie }, redirect: "manual", signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    if (response.status !== 200 || body.includes('<meta id="__next-page-redirect"')) throw new Error(`Warmup ${profile.name} ${path}: ${response.status}`);
  }
  const output = `/tmp/estatedesk-capacity-load-${profile.name}.json`;
  try {
    await run(process.execPath, ["scripts/load-test.mjs"], { env: {
      ...process.env, LOAD_BASE_URL: base.origin, LOAD_ROUTES_FILE: routeFile,
      LOAD_COOKIE_HEADER: cookie, LOAD_OUTPUT: output, LOAD_SESSION_COOKIE: "",
      LOAD_RPM: String(profile.rpm), LOAD_DURATION_SECONDS: String(profile.duration), LOAD_CONCURRENCY: String(profile.concurrency),
      LOAD_REQUEST_TIMEOUT_MS: "10000", LOAD_FAIL_ON_ERROR_RATE: "1", LOAD_FAIL_ON_P95_MS: "1500", LOAD_ABORT_AFTER_REQUESTS: "25",
    }, timeout: 90000 });
    results.push({ profile: profile.name, passed: true, ...JSON.parse(await readFile(output, "utf8")).summary });
  } catch (error) {
    let summary;
    try { summary = JSON.parse(await readFile(output, "utf8")).summary; } catch { /* Record harness failure without printing a child process environment. */ }
    results.push({ profile: profile.name, passed: false, ...(summary || { error: "Load harness failed or exceeded its deadline." }) });
  }
}
await writeFile(process.env.AUDIT_OUTPUT || "/tmp/estatedesk-capacity-smoke.json", JSON.stringify({ checkedAt: new Date().toISOString(), method: "Warm local production build, synthetic small dataset, sequential public/admin/tenant profiles, request concurrency capped at 8, or 16 for the admin ramp. Public 1200RPM; admin 600 then 1800RPM if earlier checks pass; tenant 600RPM; 15 seconds per profile. Not a concurrent-user limit, sustained soak test or production SLA.", results }, null, 2));
for (const result of results) console.log(`${result.passed ? "PASS" : "FAIL"} ${result.profile}: ${result.completed ?? 0} requests, p95 ${result.latency?.p95 ?? "unknown"}, errors ${result.errorRatePercent ?? "unknown"}%`);
if (results.some(result => !result.passed)) process.exitCode = 1;
