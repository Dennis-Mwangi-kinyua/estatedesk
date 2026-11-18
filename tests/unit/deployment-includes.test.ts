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

test("deployment includes native mobile routes and shared contracts", () => {
  for (const directory of ["apps/web/src/app/api/mobile", "apps/web/src/lib/mobile", "packages/contracts/src"]) {
    for (const file of filesBelow(directory)) {
      assert.equal(deploymentIgnore.ignores(file), false, `${file} must reach the mobile backend build`);
    }
  }
});

test("deployment excludes root backup artifacts and secrets", () => {
  for (const file of ["backups/production.dump", "backups/production.dump.sha256", "backup-routes/old/page.tsx", ".env", "apps/web/.env.local", ".aws/credentials"]) {
    assert.equal(deploymentIgnore.ignores(file), true, `${file} must stay out of the deployment`);
  }
});

test("web deployment excludes native build artifacts while retaining app sources", () => {
  for (const file of ["apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk", "apps/mobile/ios/Pods/React.framework/React", "apps/mobile/.expo/devices.json", "apps/mobile/dist/index.hbc"]) {
    assert.equal(deploymentIgnore.ignores(file), true, `${file} must stay out of the web upload`);
  }
  for (const file of ["apps/mobile/package.json", "apps/mobile/src/api.ts", "apps/mobile/App.tsx"]) {
    assert.equal(deploymentIgnore.ignores(file), false, `${file} remains available to the workspace build`);
  }
});


test("Vercel schedules remain compatible with daily-only hosting plans", () => {
  for (const filename of ["vercel.json", "apps/web/vercel.json"]) {
    const config = JSON.parse(readFileSync(path.join(root, filename), "utf8"));
    for (const job of config.crons) {
      const fields = job.schedule.trim().split(/\s+/);
      assert.equal(fields.length, 5);
      assert.match(fields[0], /^\d+$/, `${filename}: no subdaily minute schedules`);
      assert.match(fields[1], /^\d+$/, `${filename}: no subdaily hour schedules`);
    }
    assert.equal(config.crons.some((job: { path: string }) => job.path === "/api/cron/notifications"), false);
  }
});
