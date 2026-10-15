import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import ignore from "ignore";

const root = path.resolve(import.meta.dirname, "../..");
const deploymentIgnore = ignore().add(readFileSync(path.join(root, ".vercelignore"), "utf8"));

function filesBelow(directory: string): string[] {
  return readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? filesBelow(file) : [file];
  });
}

test("deployment includes every platform route and its supporting source", () => {
  for (const file of filesBelow("apps/web/src/app/(app)/platform")) {
    assert.equal(deploymentIgnore.ignores(file), false, `${file} must reach the deployment build`);
  }
});

test("deployment excludes root backup artifacts and secrets", () => {
  for (const file of ["backups/production.dump", "backups/production.dump.sha256", "backup-routes/old/page.tsx", ".env", "apps/web/.env.local", ".aws/credentials"]) {
    assert.equal(deploymentIgnore.ignores(file), true, `${file} must stay out of the deployment`);
  }
});
