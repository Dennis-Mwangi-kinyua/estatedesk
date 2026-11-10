import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { launchTestBrowser } from "../helpers/browser";

test("organization delete button shows a circular spinner, prevents repeat submits and recovers after completion", async () => {
  const bundle = await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{DeleteOrganizationButton}from'./apps/web/src/app/(app)/platform/organizations/[slug]/_components/delete-organization-button';window.submits=0;createRoot(document.getElementById('root')).render(<form action={async()=>{window.submits++;await new Promise(resolve=>{window.completeDelete=resolve})}}><DeleteOrganizationButton/></form>);`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json" });
  const browser = await launchTestBrowser({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 393, height: 851 } });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setContent('<div id="root"></div><style>.animate-spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.waitForTimeout(150);
    assert.deepEqual(errors, []);
    assert.match(await page.locator("#root").innerHTML(), /Delete organization/);
    const button = page.getByRole("button", { name: "Delete organization" });
    await button.click();
    await page.waitForFunction(() => document.querySelector("button")?.getAttribute("aria-busy") === "true");
    assert.equal(await page.locator("button").isDisabled(), true);
    assert.equal(await page.getByRole("status").innerText(), "Deleting…");
    assert.equal(await page.locator("button svg").evaluate(el => getComputedStyle(el).animationName), "spin");
    assert.equal(await page.evaluate("window.submits"), 1);
    await page.evaluate("window.completeDelete()");
    await page.waitForFunction(() => !document.querySelector("button")?.disabled);
    assert.equal(await button.innerText(), "Delete organization");
  } finally { await browser.close(); }
});
