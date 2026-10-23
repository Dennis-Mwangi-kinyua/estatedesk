import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("capacity seed refuses production databases and unsafe fixture output before connecting", () => {
  const cases = [
    { TEST_DATABASE_URL: "", LOAD_SESSIONS_FILE: "/tmp/private-capacity.json" },
    { TEST_DATABASE_URL: "postgresql://user:private-password@production.example/test", LOAD_SESSIONS_FILE: "/tmp/private-capacity.json" },
    { TEST_DATABASE_URL: "postgresql://test@127.0.0.1:1/capacity_test", LOAD_SESSIONS_FILE: "sessions.json" },
    { TEST_DATABASE_URL: "postgresql://test@127.0.0.1:1/capacity_test", LOAD_SESSIONS_FILE: "/tmp/private-capacity.json", CAPACITY_USERS: "999" },
  ];
  for (const values of cases) {
    const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/qa/seed-capacity.ts"], {
      env: { ...process.env, AUTH_SECRET: "isolated-test-secret", CAPACITY_USERS: "1000", ...values }, encoding: "utf8", timeout: 10000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /disposable local|outside the repository|between 1000 and 10000/);
    assert.ok(!result.stderr.includes("private-password"));
  }
});
