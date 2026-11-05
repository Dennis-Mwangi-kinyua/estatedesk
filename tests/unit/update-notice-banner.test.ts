import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { chromium } from "playwright";

test("notice polling respects disabled background refresh and server retry delays", async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {ScheduledUpdateBanner} from './apps/web/src/features/platform-updates/banner';createRoot(document.getElementById('root')).render(<ScheduledUpdateBanner/>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "notice-browser", setup(builder) {
      builder.onResolve({ filter: /^(@\/lib\/dev\/background-refresh|lucide-react)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
        contents: args.path === "lucide-react" ? "export const CalendarClock=()=>null;" : "export const getPollingIntervalMs=()=>window.noticeInterval;",
        loader: "js",
      }));
    } }],
  });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const interval of [0, 60_000]) {
      const page = await browser.newPage();
      await page.clock.install();
      await page.setContent('<div id="root"></div>');
      await page.evaluate(interval => {
        const state = window as unknown as { noticeInterval: number; reads: number };
        state.noticeInterval = interval;
        state.reads = 0;
        window.fetch = async () => {
          state.reads++;
          return new Response("null", { status: 503, headers: { "Retry-After": "120" } });
        };
      }, interval);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      // Let the initial React effect run before moving the clock.
      await page.clock.runFor(50);
      const reads = () => page.evaluate(() => (window as unknown as { reads: number }).reads);
      assert.equal(await reads(), 1);
      await page.clock.runFor(60_000);
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      assert.equal(await reads(), 1, "visibility changes must honor Retry-After");
      await page.clock.runFor(120_000);
      assert.equal(await reads(), interval ? 2 : 1);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
