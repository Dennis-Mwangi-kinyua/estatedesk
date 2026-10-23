import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("load harness rejects external destinations and mutations before sending cookies", async () => {
  const directory = await mkdtemp(join(tmpdir(), "load-safety-"));
  try {
    for (const route of [{ path: "https://other.example/private" }, { path: "//other.example/private" }, { path: "/\\other.example/private" }, { path: "/api/payments", method: "POST" }]) {
      const file = join(directory, "routes.json");
      await writeFile(file, JSON.stringify([route]));
      const result = spawnSync(process.execPath, ["scripts/load-test.mjs"], { env: { ...process.env, LOAD_BASE_URL: "http://127.0.0.1:1", LOAD_ROUTES_FILE: file, LOAD_COOKIE_HEADER: "session=test-only" }, encoding: "utf8", timeout: 5000 });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /refusing to send credentials|read-only GET\/HEAD/);
      assert.ok(!result.stdout.includes('"event": "load-test-start"'));
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("load harness fails streamed login redirects and terminates stalled requests", async () => {
  const { createServer } = await import("node:http");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const { readFile } = await import("node:fs/promises");
  const run = promisify(execFile);
  const server = createServer((request, response) => {
    if (request.url === "/stall") return;
    response.setHeader("Content-Type", "text/html");
    response.end('<meta id="__next-page-redirect" http-equiv="refresh" content="1;url=/login"/>');
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const directory = await mkdtemp(join(tmpdir(), "load-response-"));
  try {
    for (const route of ["/redirect", "/stall"]) {
      const file = join(directory, "routes.json");
      const output = join(directory, "report.json");
      await writeFile(file, JSON.stringify([{ path: route, expectedStatus: [200] }]));
      await assert.rejects(run(process.execPath, ["scripts/load-test.mjs"], { env: { ...process.env, LOAD_BASE_URL: `http://127.0.0.1:${address.port}`, LOAD_ROUTES_FILE: file, LOAD_RPM: "600", LOAD_DURATION_SECONDS: "0.1", LOAD_CONCURRENCY: "1", LOAD_REQUEST_TIMEOUT_MS: route === "/redirect" ? "2000" : "100", LOAD_FAIL_ON_ERROR_RATE: "1", LOAD_OUTPUT: output, LOAD_COOKIE_HEADER: "", LOAD_SESSION_COOKIE: "" }, timeout: 5000 }));
      const report = JSON.parse(await readFile(output, "utf8"));
      assert.equal(report.summary.failed, 1);
      assert.equal(report.summary.completed, 1);
      if (route === "/redirect") assert.match(report.summary.sampleErrors[0].message, /Streamed framework redirect/);
      else assert.equal(report.summary.statuses["0"], 1);
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
