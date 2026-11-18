import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
test("legacy developer home redirects to the unified platform workspace", async () => {
  const bundle = await build({ entryPoints: ["apps/web/src/app/(app)/platform/developer/page.tsx"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "redirect-fixture", setup(builder) {
    builder.onResolve({ filter: /^next\/navigation$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: 'export const redirect=path=>{throw new Error("Redirect:"+path)}', loader: "js" }));
  } }] });
  const module = { exports: {} as { default: () => never } };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  assert.throws(() => module.exports.default(), /Redirect:\/platform$/);
});
