import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
for (const os of ["ios", "android"]) for (const width of [390, 834]) test(`${os}: reports show grouped detailed cards at ${width}px and open full report details`, async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {NativeWorkspace} from './apps/mobile/src/components/native-workspace';createRoot(document.getElementById('root')).render(<NativeWorkspace target={{kind:'platform',path:'/platform/reports',title:'Reports',description:'Platform overview',emoji:'users'}} open={()=>{}} onBack={()=>{}} onError={()=>{window.__unauthorized=true}}/>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", alias: { react: path.dirname(require.resolve("react/package.json")) }, define: { "process.env.NODE_ENV": '"test"' },
    plugins: [{ name: "native-directory", setup(builder) {
      builder.onResolve({ filter: /^react-native$|^react-native-safe-area-context$|^\.\/app-icon$|^\.\/native-action-form$|^\.\.\/api$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
        args.path === "react-native" ? `import React from 'react';export const View=({children,onLayout})=>{React.useEffect(()=>{onLayout?.({nativeEvent:{layout:{width:${width - 40}}}})},[]);return <div>{children}</div>};export const ScrollView=View;export const Modal=({children})=><div role="dialog">{children}</div>;export const Text=({children,accessibilityRole})=><span role={accessibilityRole==='alert'?'alert':undefined}>{children}</span>;export const Pressable=({children,onPress,disabled,accessibilityLabel,style})=>{const resolved=Object.assign({},...[typeof style==='function'?style({pressed:false}):style].flat(Infinity).filter(Boolean));return <button data-card-width={resolved.width} data-grow={resolved.flexGrow} aria-label={accessibilityLabel} disabled={disabled} onClick={onPress}>{children}</button>};export const TextInput=({value,onChangeText,accessibilityLabel})=><input aria-label={accessibilityLabel} value={value} onChange={e=>onChangeText(e.target.value)}/>;export const ActivityIndicator=()=>null;export const StyleSheet={create:v=>v};export const Platform={OS:'${os}'};export const Keyboard={dismiss(){}};export const PixelRatio={get:()=>2};export const useWindowDimensions=()=>({width:390,fontScale:1});`
          : args.path === "react-native-safe-area-context" ? `import React from 'react';export const SafeAreaView=({children})=><div>{children}</div>;`
          : args.path === "./app-icon" ? `export const AppIcon=()=>null;export const IconTile=()=>null;`
          : args.path === "./native-action-form" ? `export const NativeActionForm=()=>null;`
          : `export class ApiError extends Error{};export const getHelp=async()=>({records:[]});export async function getNativeWorkspace(){return {page:1,hasMore:false,related:[],searchable:false,notice:'Payment activity is a sample of the latest 500 payments.',records:[['organizations','Organizations'],['subscriptions','Subscription health'],['payment-volume','Recent payment activity'],['issues','Maintenance workload'],['notifications','Notification delivery']].map(([id,title])=>({id,title,subtitle:id==='payment-volume'?'Latest 500 payments, not an all-time total.':'Current platform snapshot.',fields:[{label:'Total',value:'128'},{label:'Active',value:'100'},{label:'Needs attention',value:'28'},{label:'Updated',value:'22 Oct 2026, 15:00'}]}))}}`,
      }));
    } }],
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.getByRole("button", { name: "Organizations", exact: true }).waitFor();
    for (const title of ["Workspace coverage", "Billing & payments", "Operations & delivery"]) await page.getByText(title, { exact: true }).waitFor();
    assert.equal(await page.getByText("Full report", { exact: true }).count(), 5);
    const paymentCard = page.getByRole("button", { name: "Recent payment activity", exact: true });
    if (width === 390) assert.equal(await paymentCard.getAttribute("data-card-width"), "169");
    else assert.equal(await paymentCard.getAttribute("data-grow"), "1");
    assert.equal(await page.getByRole("button", { name: "Organizations", exact: true }).getAttribute("data-card-width"), "100%");
    assert.equal(await page.getByRole("button", { name: "Next", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Recent payment activity", exact: true }).click();
    await page.getByRole("dialog").getByText("22 Oct 2026, 15:00", { exact: true }).first().waitFor();
    await page.getByRole("dialog").getByText("Latest 500 payments, not an all-time total.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Back to Reports", exact: true }).click();
    await page.getByRole("button", { name: "Refresh reports", exact: true }).click();
    await page.getByRole("button", { name: "Organizations", exact: true }).waitFor();
  } finally { await browser.close(); }
});
