import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const base = process.env.AUDIT_BASE_URL || "http://127.0.0.1:3107";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("Only disposable local servers are allowed.");
const fixture = JSON.parse(await readFile("/tmp/estatedesk-role-workspaces.json", "utf8"));
const results = [];
for (const role of ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "TENANT", "LANDLORD", "SECURITY", "PLATFORM_ADMIN", "PROVIDER"]) {
  const state = JSON.parse(await readFile(`/tmp/estatedesk-role-state-${role}.json`, "utf8"));
  const routes = `/tmp/estatedesk-load-${role}.json`;
  await writeFile(routes, JSON.stringify([{ path: fixture.accounts[role].home, method: "GET", weight: 1, expectedStatus: [200] }]));
  const { stdout } = await run(process.execPath, ["scripts/load-test.mjs"], { env: {
    ...process.env, LOAD_BASE_URL: base, LOAD_ROUTES_FILE: routes,
    LOAD_COOKIE_HEADER: state.cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; "),
    LOAD_RPM: "600", LOAD_DURATION_SECONDS: "2", LOAD_CONCURRENCY: "4", LOAD_FAIL_ON_ERROR_RATE: "1",
  } });
  const start = stdout.indexOf('{\n  "event": "load-test-summary"');
  results.push({ role, ...JSON.parse(stdout.slice(start)).summary });
}
await writeFile("/tmp/estatedesk-workspace-load.json", JSON.stringify({ method: "20 requests per role, concurrency cap 4, local development server and small synthetic dataset. Capacity smoke check, not production SLA evidence.", results }, null, 2));
console.log("Local authenticated load smoke recorded.");
