import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
for (const os of ["ios", "android"]) test(`${os}: report filters, drilldown, exports and stale-data recovery retain their scope`, async () => {
  const bundle = await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{NativePlatformReports}from'./apps/mobile/src/components/native-platform-reports';createRoot(document.getElementById('root')).render(<NativePlatformReports onError={()=>{window.__unauthorized=true}}/>);`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", alias: { react: path.dirname(require.resolve("react/package.json")) }, define: { "process.env.NODE_ENV": '"test"' }, plugins: [{ name: "reports-ui", setup(builder) {
    builder.onResolve({ filter: /^react-native$|^react-native-safe-area-context$|^\.\/app-icon$|^\.\.\/api$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
      args.path === "react-native" ? `import React from'react';export const View=({children})=><div>{children}</div>;export const ScrollView=View;export const Modal=({children})=><div role="dialog">{children}</div>;export const Text=({children,accessibilityRole})=><span role={accessibilityRole==='alert'?'alert':undefined}>{children}</span>;export const Pressable=({children,onPress,disabled,accessibilityLabel})=><button aria-label={accessibilityLabel} disabled={disabled} onClick={onPress}>{children}</button>;export const TextInput=({value,onChangeText,accessibilityLabel})=><input aria-label={accessibilityLabel} value={value} onChange={event=>onChangeText(event.target.value)}/>;export const ActivityIndicator=()=>null;export const StyleSheet={create:v=>v};export const Platform={OS:'${os}'};export const Keyboard={dismiss(){}};export const PixelRatio={get:()=>2};export const useWindowDimensions=()=>({width:390,fontScale:1});`
      : args.path === "react-native-safe-area-context" ? `import React from'react';export const SafeAreaView=({children})=><div>{children}</div>;`
      : args.path === "./app-icon" ? `export const AppIcon=()=>null;export const IconTile=()=>null;`
      : `export class ApiError extends Error{};export async function getNativeWorkspace(kind,path,q,page,id,organization,filters){(window.__reads??=[]).push(filters);if(window.__failRead){window.__failRead=false;throw new Error('Report temporarily unavailable')};return {page:1,hasMore:false,related:[],searchable:false,records:[['organizations','Organizations'],['subscriptions','Subscription health'],['payment-volume','Verified payments'],['issues','Maintenance workload'],['notifications','Notification delivery'],['attention','Needs attention']].map(([id,title])=>({id,title,fields:[{label:'Current',value:'10'},{label:'Change',value:'+5 (100.0%)'}]})),report:{generatedAt:new Date().toISOString(),from:filters.from??'2026-10-01',to:filters.to??'2026-10-22',previousFrom:'2026-09-01',previousTo:'2026-09-22',scopeName:organization?'Alpha':'All organizations',metric:filters.metric,hasMore:!organization&&filters.page===1,organizations:[{id:organization??(filters.page===1?'a':'b'),name:organization?'Alpha':filters.page===1?'Alpha':'Beta',current:10,previous:5,attention:2,amounts:[{currency:'KES',current:'100.00',previous:'50.00'}]}]}}};export async function exportPlatformReport(filters,format){(window.__exports??=[]).push({filters,format});if(window.__failExport){window.__failExport=false;throw new Error('Export temporarily unavailable')}};`,
    }));
  } }] });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage(); await page.setContent('<div id="root"></div>'); await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.getByText("Report up to date", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.waitForFunction(() => (window as any).__reads.at(-1).reportPeriod === 'today');
    await page.getByRole("button", { name: "Last month", exact: true }).click();
    await page.waitForFunction(() => (window as any).__reads.at(-1).reportPeriod === 'lastMonth');
    await page.getByRole("button", { name: "Custom dates", exact: true }).click();
    await page.getByRole("textbox", { name: "From (YYYY-MM-DD)" }).fill("2026-09-01");
    await page.getByRole("textbox", { name: "To (YYYY-MM-DD)" }).fill("2026-09-30");
    await page.getByRole("button", { name: "Apply dates", exact: true }).click();
    await page.waitForFunction(() => (window as any).__reads.at(-1).from === '2026-09-01');
    await page.getByRole("button", { name: "Verified payments", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Next organizations", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Beta", exact: true }).click();
    await page.waitForFunction(() => (window as any).__reads.at(-1).organization === 'b');
    await page.getByRole("button", { name: "Back to Reports", exact: true }).click();
    await page.getByRole("button", { name: "Export PDF", exact: true }).click();
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    const exports = await page.evaluate(() => (window as any).__exports);
    assert.deepEqual(exports.map((e: any) => e.format), ['pdf', 'csv']);
    assert.ok(exports.every((e: any) => e.filters.organization === 'b' && e.filters.metric === 'payment-volume' && e.filters.from === '2026-09-01' && e.filters.to === '2026-09-30'));
    await page.evaluate(() => { (window as any).__failRead = true; });
    await page.getByRole("button", { name: "Refresh reports", exact: true }).click();
    await page.getByText("Report temporarily unavailable", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Export PDF", exact: true }).isDisabled(), true);
    await page.getByText("Snapshot needs refreshing", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await page.getByText("Report up to date", { exact: true }).waitFor();
    await page.evaluate(() => { (window as any).__failExport = true; });
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    await page.getByText("Export temporarily unavailable", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    assert.equal(await page.getByText("Export temporarily unavailable", { exact: true }).count(), 0);
  } finally { await browser.close(); }
});
