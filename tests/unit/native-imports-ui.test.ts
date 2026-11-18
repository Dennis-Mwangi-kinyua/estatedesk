import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";
import { launchTestBrowser } from "../helpers/browser";

test("native CSV imports invalidate changed previews and require confirmation before writing", async () => {
  const require = createRequire(import.meta.url);
  const bundle = await build({
    stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {NativeImports} from './apps/mobile/src/components/native-imports';createRoot(document.getElementById('root')).render(<NativeImports onError={()=>{}}/>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic",
    alias: { react: path.dirname(require.resolve("react/package.json")) }, define: { "process.env.NODE_ENV": '"test"' },
    plugins: [{ name: "native-import-hosts", setup(builder) {
      const mocks: Record<string, string> = {
        "react-native": `import React from 'react';export const View=({children})=><div>{children}</div>;export const Text=({children})=><span>{children}</span>;export const ActivityIndicator=()=>null;export const Alert={alert:(_title,_message,buttons)=>{window.__confirm=()=>buttons[1].onPress()}};`,
        "expo-document-picker": `export const getDocumentAsync=async()=>({canceled:true});`,
        "expo-file-system": `export class File {}`,
        "expo-crypto": `let count=0;export const randomUUID=()=>"00000000-0000-4000-8000-"+String(++count).padStart(12,"0");`,
        "./ui": `import React from 'react';export const styles={};export const Button=({label,onPress,disabled})=><button onClick={onPress} disabled={disabled}>{label}</button>;export const Field=({label,value,onChangeText,editable})=><textarea aria-label={label} value={value} disabled={!editable} onChange={e=>onChangeText(e.target.value)}/>;`,
        "../api": `export class ApiError extends Error {status=401};export const getImportTemplate=async()=>({template:'name\\nSample'});export async function runImport(input){window.__calls=(window.__calls||[]);window.__calls.push(input);return {ok:true,dryRun:input.mode==='dry-run',kind:input.kind,totalRows:1,validRows:1,created:input.mode==='commit'?1:0,message:input.mode==='commit'?'Imported 1 property':'Validation passed',errors:[],preview:[],rowResults:[{line:2,label:'Test property',status:'valid',errors:[]}],...(input.mode==='dry-run'?{validationToken:'validated-exact-csv'}:{})}};`,
      };
      builder.onResolve({ filter: /^(react-native|expo-crypto|expo-document-picker|expo-file-system|\.\/ui|\.\.\/api)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "tsx", resolveDir: process.cwd() }));
    } }],
  });
  const browser = await launchTestBrowser({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const csv = page.getByRole("textbox", { name: "CSV including column headers" });
    await csv.fill("name\nFirst property");
    await page.getByRole("button", { name: "Validate CSV", exact: true }).click();
    await page.getByRole("button", { name: "Confirm import of 1 properties" }).waitFor();
    await csv.fill("name\nChanged property");
    assert.equal(await page.getByRole("button", { name: "Confirm import of 1 properties" }).count(), 0);
    await page.getByRole("button", { name: "Validate CSV", exact: true }).click();
    await page.getByRole("button", { name: "Confirm import of 1 properties" }).click();
    assert.equal(await page.evaluate(() => (window as any).__calls.filter((call: any) => call.mode === "commit").length), 0);
    await page.evaluate(() => (window as any).__confirm());
    await page.getByText("Imported 1 property", { exact: true }).waitFor();
    const calls = await page.evaluate(() => (window as any).__calls);
    assert.equal(calls.length, 3);
    assert.equal(calls[2].csv, "name\nChanged property");
    assert.equal(calls[2].validationToken, "validated-exact-csv");
    assert.equal(calls[2].confirmImport, "yes");
    assert.equal(await csv.inputValue(), "");
  } finally { await browser.close(); }
});
