import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, access, mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

test("service capacity routes point to real pages and require successful responses", async () => {
  const routes = JSON.parse(await readFile("scripts/load-test-routes.all-services.json", "utf8")) as Array<{ path: string; weight: number; expectedStatus: number[] }>;
  assert.equal(new Set(routes.map(route => route.path)).size, routes.length);
  for (const route of routes) {
    await access(join("apps/web/src/app/(app)", route.path, "page.tsx"));
    assert.equal(route.weight, 1);
    assert.deepEqual(route.expectedStatus, [200]);
  }
});

test("a slow or undersampled service fails independently of the overall latency gate", async () => {
  const server = createServer((request, response) => {
    if (request.url === "/slow") setTimeout(() => response.end("ok"), 100);
    else response.end("ok");
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const directory = await mkdtemp(join(tmpdir(), "service-capacity-"));
  try {
    const port = (server.address() as { port: number }).port;
    const routes = join(directory, "routes.json");
    const output = join(directory, "report.json");
    await writeFile(routes, JSON.stringify([{ path: "/fast" }, { path: "/slow" }]));
    const run = promisify(execFile);
    for (const limits of [
      { LOAD_FAIL_ON_ROUTE_P95_MS: "50", LOAD_MIN_REQUESTS_PER_ROUTE: "" },
      { LOAD_FAIL_ON_ROUTE_P95_MS: "", LOAD_MIN_REQUESTS_PER_ROUTE: "1000" },
    ]) {
      await assert.rejects(run(process.execPath, ["scripts/load-test.mjs"], {
        env: { ...process.env, LOAD_BASE_URL: `http://127.0.0.1:${port}`, LOAD_ROUTES_FILE: routes, LOAD_OUTPUT: output,
          LOAD_PROFILE: "smoke", LOAD_RPM: "2400", LOAD_DURATION_SECONDS: "1", LOAD_CONCURRENCY: "8",
          LOAD_COOKIE_HEADER: "", LOAD_SESSION_COOKIE: "", LOAD_SESSIONS_FILE: "", LOAD_FAIL_ON_P95_MS: "", ...limits },
        timeout: 10000,
      }));
      const { summary } = JSON.parse(await readFile(output, "utf8"));
      assert.equal(summary.failed, 0);
      if (limits.LOAD_FAIL_ON_ROUTE_P95_MS) {
        assert.ok(summary.routeLatencyFailures.includes("/slow"));
        assert.ok(summary.routes["/slow"].p95LatencyMs >= 90);
      } else assert.deepEqual(summary.routeCoverageFailures.sort(), ["/fast", "/slow"]);
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
