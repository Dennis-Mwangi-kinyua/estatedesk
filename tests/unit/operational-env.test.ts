import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

test("operational defaults preserve exported database selection and initialize root when preloaded", () => {
  const root = mkdtempSync(path.join(tmpdir(), "estatedesk-env-test-"));
  const lib = path.join(root, "scripts/lib");
  mkdirSync(lib, { recursive: true });
  const script = path.join(lib, "load-env.sh");
  copyFileSync("scripts/lib/load-env.sh", script);
  writeFileSync(path.join(root, ".env"), 'DATABASE_URL="repository-default"\nOPERATIONAL_TEST_DEFAULT="loaded"\n');
  try {
    const output = execFileSync("bash", ["-c", 'source "$1"; printf "%s|%s|%s" "$DATABASE_URL" "$OPERATIONAL_TEST_DEFAULT" "$repo_root"', "test", script], { env: { ...process.env, DATABASE_URL: "explicit-disposable", ESTATEDESK_ENV_LOADED: "" }, encoding: "utf8" });
    assert.equal(output, `explicit-disposable|loaded|${root}`);
    const preloaded = execFileSync("bash", ["-c", 'source "$1"; printf "%s" "$repo_root"', "test", script], { env: { ...process.env, ESTATEDESK_ENV_LOADED: "1" }, encoding: "utf8" });
    assert.equal(preloaded, root);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
