import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { launchTestBrowser } from "../helpers/browser";

test("platform heading remains hydration-safe after the presentation enhancer runs", async () => {
  const component = "./apps/web/src/app/(app)/platform/_components/platform-dashboard-heading";
  const server = await build({ stdin: { contents: `import React from 'react';import{renderToString}from'react-dom/server';import{PlatformDashboardHeading}from'${component}';export const html=renderToString(<PlatformDashboardHeading/>);`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "node", format: "cjs", packages: "external", jsx: "automatic", tsconfig: "apps/web/tsconfig.json" });
  const mod = { exports: {} as { html: string } };
  new Function("require", "module", "exports", server.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports);
  const client = await build({ stdin: { contents: `import React from 'react';import{createRoot,hydrateRoot}from'react-dom/client';import{PlatformDashboardHeading}from'${component}';import{SiteExperience}from'./apps/web/src/components/shared/site-experience';createRoot(document.getElementById('enhancer')).render(<SiteExperience/>);window.hydrateHeading=()=>hydrateRoot(document.getElementById('heading'),<PlatformDashboardHeading/>);`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "navigation", setup(builder) {
    builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "export const usePathname=()=>'/platform';", loader: "js" }));
  } }] });
  const browser = await launchTestBrowser({ headless: true });
  try {
    const page = await browser.newPage();
    const warnings: string[] = [];
    page.on("console", message => { if (/hydrat/i.test(message.text())) warnings.push(message.text()); });
    await page.setContent(`<main id="main-content" class="estate-workspace"><div id="heading">${mod.exports.html}</div><div id="enhancer"></div></main>`);
    const initial = await page.locator("h1").evaluate(el => el.outerHTML);
    await page.addScriptTag({ content: client.outputFiles[0].text });
    await page.waitForTimeout(500);
    assert.equal(await page.locator("h1").evaluate(el => el.outerHTML), initial);
    await page.evaluate("window.hydrateHeading()");
    await page.waitForTimeout(100);
    assert.deepEqual(warnings, []);
  } finally { await browser.close(); }
});
