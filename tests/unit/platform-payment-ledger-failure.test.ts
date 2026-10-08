import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

test("payment ledger failure offers recovery without exposing errors or fabricated totals", async () => {
  const bundle = await build({
    entryPoints: [path.resolve("apps/web/src/app/(app)/platform/payments/page.tsx")],
    bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
    jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "payment-ledger-fixture", setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/(ledger|permissions\/guards)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "next-link", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => {
        const mocks: Record<string, string> = {
          "@/lib/ledger": 'export const getPlatformPaymentLedger = async () => {const error = new Error("private database detail"); error.code = "P2024"; throw error;}; export const formatLedgerCurrency = String; export const formatLedgerDate = String;',
          "@/lib/permissions/guards": 'export const requirePlatformRole = async () => ({ platformRole: "SUPER_ADMIN" });',
          "next-link": 'import React from "react"; export default function Link(props) { return React.createElement("a", props); }',
        };
        return { contents: mocks[args.path], loader: "js", resolveDir: process.cwd() };
      });
    } }],
  });
  const module = { exports: {} as { default?: (props: object) => Promise<ReactNode> } };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
  const originalError = console.error;
  try {
    console.error = () => {};
    const html = renderToStaticMarkup(await module.exports.default!({searchParams: Promise.resolve({page: "2", q: "Greenview"})}));
    assert.match(html, /Payment ledger is temporarily unavailable/);
    assert.match(html, /Retry ledger/);
    assert.match(html, /page=2.*q=Greenview/);
    assert.match(html, /Check system health/);
    assert.doesNotMatch(html, /private database detail|Total deficit|Recorded paid/);
  } finally { console.error = originalError; }
});
