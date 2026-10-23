import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

for (const [script, flag] of [
  ["scripts/qa/live-db-read-load.mjs", "LIVE_DB_READ_LOAD"],
  ["scripts/qa/live-account-read-load.mjs", "LIVE_ACCOUNT_READ_LOAD"],
]) {
  test(`${script} refuses to connect without explicit authorization`, () => {
    const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: "postgresql://test:private-test-password@127.0.0.1:1/test", AUTH_SECRET: "private-test-secret" };
    delete env[flag];
    const result = spawnSync(process.execPath, [script], { env, encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Explicit live-.*authorization is required/);
    assert.doesNotMatch(result.stderr + result.stdout, /private-test-password|private-test-secret|ECONNREFUSED|Sanitized live/);
  });
}

test("live account load rejects excessive traffic settings before connecting", () => {
  for (const limits of [{ LIVE_READ_CONCURRENCY: "33" }, { LIVE_READ_STAGE_RPMS: "6001" }]) {
    const result = spawnSync(process.execPath, ["scripts/qa/live-account-read-load.mjs"], {
      env: { ...process.env, LIVE_ACCOUNT_READ_LOAD: "authorized", LOAD_TEST_ACCOUNT_EMAIL: "fixture@example.test",
        AUTH_SECRET: "private-test-secret", DATABASE_URL: "postgresql://test:private-test-password@127.0.0.1:1/test", ...limits },
      encoding: "utf8", timeout: 10000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /at most five stages/);
    assert.doesNotMatch(result.stderr + result.stdout, /private-test-password|private-test-secret|ECONNREFUSED|Sanitized live/);
  }
});
