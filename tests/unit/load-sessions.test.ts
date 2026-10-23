import assert from "node:assert/strict";
import { test } from "node:test";
import { parseLoadSessions } from "../../scripts/lib/load-sessions.mjs";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("load fixtures reject empty, duplicate and malformed sessions without exposing credentials", () => {
  const session = { userId: "fictional-1", cookieHeader: "session=private-value" };
  for (const value of [[], null, [null], [{}], [session, session], [session, { ...session, userId: "fictional-2" }], [{ ...session, cookieHeader: "session=x\r\nInjected: y" }]]) {
    assert.throws(() => parseLoadSessions(value), error => {
      assert.ok(!String(error).includes("private-value"));
      return true;
    });
  }
});

test("load harness exercises more than 1,000 distinct sessions and redacts its report", async () => {
  const received = new Set<string>();
  const server = createServer((request, response) => {
    received.add(request.headers.cookie ?? "");
    response.end("ok");
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const directory = await mkdtemp(join(tmpdir(), "load-users-"));
  try {
    const port = (server.address() as { port: number }).port;
    const sessions = Array.from({ length: 1001 }, (_, i) => ({ userId: `fictional-${i}`, cookieHeader: `session=private-${i}` }));
    const sessionFile = join(directory, "sessions.json");
    const routeFile = join(directory, "routes.json");
    const output = join(directory, "report.json");
    await writeFile(sessionFile, JSON.stringify(sessions), { mode: 0o600 });
    await writeFile(routeFile, JSON.stringify([{ path: "/dashboard/org", expectedStatus: [200] }]));
    const { stdout } = await promisify(execFile)(process.execPath, ["scripts/load-test.mjs"], {
      env: { ...process.env, LOAD_BASE_URL: `http://127.0.0.1:${port}`, LOAD_PROFILE: "users1000", LOAD_SESSIONS_FILE: sessionFile, LOAD_ROUTES_FILE: routeFile, LOAD_RPM: "30030", LOAD_DURATION_SECONDS: "2", LOAD_CONCURRENCY: "20", LOAD_OUTPUT: output, LOAD_FAIL_ON_P95_MS: "10000", LOAD_FAIL_ON_SCHEDULING_P95_MS: "10000" },
      timeout: 20000,
    });
    const raw = await readFile(output, "utf8");
    const report = JSON.parse(raw);
    assert.equal(received.size, 1001);
    assert.equal(report.summary.exercisedSessions, 1001);
    assert.equal(report.summary.failed, 0);
    assert.ok(!(raw + stdout).includes("private-"));
    assert.ok(!(raw + stdout).includes("fictional-"));
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
