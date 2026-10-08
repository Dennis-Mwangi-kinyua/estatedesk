import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

test("developer tools remain available when notification metrics fail", async () => {
  const bundle = await build({
    entryPoints: [path.resolve("apps/web/src/app/(app)/platform/developer/page.tsx")],
    bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
    jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "developer-metric-fixture", setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/(prisma|permissions\/guards|integrations|db\/retry)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "next-link", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => {
        const mocks: Record<string, string> = {
          "@/lib/prisma": `const count = async () => 4; const failure = async () => { const error = new Error("simulated database outage"); error.code = "P2024"; throw error; }; export const prisma = { apiKey: { count }, notification: { groupBy: failure, count: failure }, payment: { count }, auditLog: { findFirst: async () => null }, dataExportRequest: { count }, cronJobRun: { count } };`,
          "@/lib/permissions/guards": 'export const requirePlatformRole = async () => ({ platformRole: "SUPER_ADMIN" });',
          "@/lib/integrations": 'export const getIntegrationReadinessReport = () => ({ totals: { ready: 0, partial: 0, pendingApproval: 0, misconfigured: 0, stubbed: 0 }, integrations: [] });',
          "@/lib/db/retry": 'export const retryTransientDatabaseOperation = async operation => operation();',
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
    const html = renderToStaticMarkup(await module.exports.default!({}));
    assert.match(html, /Some operational metrics could not be loaded/);
    assert.match(html, /Unavailable/);
    assert.match(html, /Developer tools/);
    assert.match(html, /Retry metrics/);
    assert.match(html, /Check system health/);
    assert.match(html, /Active API keys/);
    assert.doesNotMatch(html, /simulated database outage/);
  } finally { console.error = originalError; }
});
