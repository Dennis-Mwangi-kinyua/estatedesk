import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";
import { launchTestBrowser } from "../helpers/browser";

test("provider completion requires notes and confirmation before submitting", async () => {
  const require = createRequire(import.meta.url);
  const bundle = await build({
    stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {ProviderJobActions} from './apps/mobile/src/components/provider-job-actions';createRoot(document.getElementById('root')).render(<ProviderJobActions jobId="owned-job" status="IN_PROGRESS" onUpdated={()=>{window.__updated=true}} onError={()=>{}}/>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic",
    alias: { react: path.dirname(require.resolve("react/package.json")) }, define: { "process.env.NODE_ENV": '"test"' },
    plugins: [{ name: "provider-host", setup(builder) {
      const mocks: Record<string, string> = {
        "react-native": `import React from 'react';export const View=({children})=><div>{children}</div>;export const Text=({children})=><span>{children}</span>;export const Alert={alert:(_title,_message,buttons)=>{window.__confirm=()=>buttons[1].onPress()}};`,
        "./ui": `import React from 'react';export const styles={};export const Button=({label,onPress,disabled})=><button disabled={disabled} onClick={onPress}>{label}</button>;export const Field=({label,value,onChangeText})=><textarea aria-label={label} value={value} onChange={e=>onChangeText(e.target.value)}/>;`,
        "../api": `window.__calls=[];export async function updateProviderJob(...args){window.__calls.push(args)}`,
      };
      builder.onResolve({ filter: /^(react-native|\.\/ui|\.\.\/api)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "tsx", resolveDir: process.cwd() }));
    } }],
  });
  const browser = await launchTestBrowser({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const button = page.getByRole("button", { name: "Submit work for review" });
    assert.equal(await button.isDisabled(), true);
    await page.getByRole("textbox", { name: "Completion notes" }).fill("Repaired the kitchen tap and checked for leaks.");
    await button.click();
    assert.equal(await page.evaluate(() => (window as any).__calls.length), 0);
    await page.evaluate(() => (window as any).__confirm());
    await page.waitForFunction(() => (window as any).__updated);
    assert.deepEqual(await page.evaluate(() => (window as any).__calls[0]), ["owned-job", "submit", "Repaired the kitchen tap and checked for leaks."]);
  } finally { await browser.close(); }
});
