import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

describe("browser extension", () => {
  it("ships a manifest v3 package with badge sync and quick actions", () => {
    const manifest = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "extensions/estatedesk/manifest.json"),
        "utf8",
      ),
    ) as {
      manifest_version: number;
      action: { default_popup: string };
      background: { service_worker: string };
      content_scripts: Array<{ js: string[] }>;
      host_permissions: string[];
    };

    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.action.default_popup, "popup.html");
    assert.equal(manifest.background.service_worker, "background.js");
    assert.deepEqual(manifest.content_scripts[0]?.js, ["content.js"]);
    assert.ok(
      manifest.host_permissions.some((permission) =>
        permission.includes("estatedesk.co.ke"),
      ),
    );
  });
});