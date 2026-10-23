import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";

test("live workspace coalesces changes, defers typing, reconnects visible tabs and disposes on logout", async () => {
  const bundle = await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{WorkspaceLiveUpdates}from'./apps/web/src/components/realtime/workspace-live-updates';const root=createRoot(document.getElementById('root'));root.render(<WorkspaceLiveUpdates/>);window.unmount=()=>root.unmount();`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"test"' }, plugins: [{ name: "live-client", setup(builder) {
    builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `const router={refresh(){window.refreshes++}};export const useRouter=()=>router;export const usePathname=()=>'/dashboard/org';` }));
  } }] });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div><input aria-label="Draft"/>');
    await page.addScriptTag({ content: `window.refreshes=0;window.streams=[];window.visible=true;Object.defineProperty(document,'visibilityState',{get:()=>window.visible?'visible':'hidden'});window.EventSource=class{constructor(url){this.url=url;this.events={};window.streams.push(this)}addEventListener(name,fn){this.events[name]=fn}close(){this.closed=true}emit(name){this.events[name]?.()}};` });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.waitForFunction("window.streams.length===1");
    await page.evaluate("window.streams[0].emit('ready')");
    await page.waitForFunction("window.refreshes===1");
    await page.getByRole("textbox", { name: "Draft" }).fill("Unsent work");
    await page.evaluate("for(let i=0;i<20;i++)window.streams[0].emit('change')");
    await page.waitForTimeout(3200);
    assert.equal(await page.evaluate("window.refreshes"), 1);
    await page.getByRole("textbox", { name: "Draft" }).blur();
    await page.waitForFunction("window.refreshes===2");
    assert.equal(await page.getByRole("textbox", { name: "Draft" }).inputValue(), "Unsent work");
    await page.evaluate("window.visible=false;document.dispatchEvent(new Event('visibilitychange'))");
    assert.equal(await page.evaluate("window.streams[0].closed"), true);
    await page.evaluate("window.visible=true;document.dispatchEvent(new Event('visibilitychange'))");
    await page.waitForFunction("window.streams.length===2");
    await page.evaluate("window.unmount()");
    assert.equal(await page.evaluate("window.streams[1].closed"), true);
  } finally { await browser.close(); }
});
