import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { sourceFingerprint } from "../../scripts/lib/workflow-release.mjs";

test("web release checks detect stylesheet, public theme script, and deployment configuration changes", () => {
  const root = mkdtempSync(path.join(tmpdir(), "estatedesk-fingerprint-"));
  const write = (file: string, content: string) => {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  };
  try {
    for (const folder of ["packages", "services", "prisma"]) mkdirSync(path.join(root, folder));
    const inputs = [
      "apps/web/src/app/page.tsx", "apps/web/src/app/globals.css", "apps/web/public/theme-init.js",
      "apps/web/proxy.ts", "apps/web/middleware.ts", "apps/web/next.config.ts", "apps/web/package.json",
      "apps/web/tsconfig.json", "apps/web/vercel.json", "vercel.json", "prisma.config.ts",
      "package.json", "package-lock.json", "scripts/build-release.mjs", "scripts/lib/workflow-release.mjs",
    ];
    for (const file of inputs) write(file, "original");
    const original = sourceFingerprint("web", root);
    for (const file of ["apps/web/src/app/globals.css", "apps/web/public/theme-init.js", "vercel.json", "scripts/build-release.mjs"]) {
      write(file, "changed");
      assert.notEqual(sourceFingerprint("web", root), original, `${file} must invalidate the build`);
      write(file, "original");
      assert.equal(sourceFingerprint("web", root), original);
    }
    write("apps/web/src/.next/generated.js", "ignored artifact");
    assert.equal(sourceFingerprint("web", root), original);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
