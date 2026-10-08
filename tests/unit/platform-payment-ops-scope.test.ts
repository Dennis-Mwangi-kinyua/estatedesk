import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

test("organisation payment operations scope every metric and queue query", async () => {
  const bundle = await build({
    entryPoints: [path.resolve("apps/web/src/app/(app)/platform/payment-ops/page.tsx")],
    bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
    jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "payment-ledger-fixture", setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/(prisma|db\/retry|permissions\/guards)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "next-link", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => {
        const mocks: Record<string, string> = {
          "@/lib/prisma": 'globalThis.paymentScopes = []; const record = async args => {globalThis.paymentScopes.push(args.where); return 0;}; export const prisma = {payment:{count:record,findMany: async args => {await record(args); return [];}}};',
          "@/lib/db/retry": 'export const retryTransientDatabaseOperation = async fn => fn(); export const isTransientDatabaseError = () => false;',
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
    const html = renderToStaticMarkup(await module.exports.default!({searchParams: Promise.resolve({orgId: "org-tsa"})}));
    const scopes = (globalThis as unknown as {paymentScopes: {orgId?: string}[]}).paymentScopes;
    assert.equal(scopes.length, 5);
    assert.ok(scopes.every(scope => scope.orgId === "org-tsa"));
    assert.match(html, /Organisation payment operations/);

  } finally { console.error = originalError; }
});
