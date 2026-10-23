import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
for (const os of ["ios", "android"]) test(`${os}: organization cards open scoped users and individual identity details`, async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {NativeWorkspace} from './apps/mobile/src/components/native-workspace';createRoot(document.getElementById('root')).render(<NativeWorkspace target={{kind:'platform',path:'/platform/users',title:'Users',description:'Accounts',emoji:'users'}} open={()=>{}} onBack={()=>{}} onError={()=>{window.__unauthorized=true}}/>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", alias: { react: path.dirname(require.resolve("react/package.json")) }, define: { "process.env.NODE_ENV": '"test"' },
    plugins: [{ name: "native-directory", setup(builder) {
      builder.onResolve({ filter: /^react-native$|^react-native-safe-area-context$|^\.\/app-icon$|^\.\/native-action-form$|^\.\.\/api$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
        args.path === "react-native" ? `import React from 'react';export const View=({children})=><div>{children}</div>;export const ScrollView=View;export const Modal=({children})=><div role="dialog">{children}</div>;export const Text=({children,accessibilityRole})=><span role={accessibilityRole==='alert'?'alert':undefined}>{children}</span>;export const Pressable=({children,onPress,disabled,accessibilityLabel})=><button aria-label={accessibilityLabel} disabled={disabled} onClick={onPress}>{children}</button>;export const TextInput=({value,onChangeText,accessibilityLabel})=><input aria-label={accessibilityLabel} value={value} onChange={e=>onChangeText(e.target.value)}/>;export const ActivityIndicator=()=>null;export const StyleSheet={create:v=>v};export const Platform={OS:'${os}'};export const Keyboard={dismiss(){}};export const PixelRatio={get:()=>2};export const useWindowDimensions=()=>({width:390,fontScale:1});`
          : args.path === "react-native-safe-area-context" ? `import React from 'react';export const SafeAreaView=({children})=><div>{children}</div>;`
          : args.path === "./app-icon" ? `export const AppIcon=()=>null;export const IconTile=()=>null;`
          : args.path === "./native-action-form" ? `export const NativeActionForm=()=>null;`
          : `export class ApiError extends Error{};export const getHelp=async()=>({records:[]});export async function getNativeWorkspace(kind,path,q,page,recordId,organization){
            (window.__requests??=[]).push({q,page,recordId,organization});
            const base={title:'Users',description:'Accounts',page,hasMore:!!organization&&page===1,related:[],searchable:true};
            if(!organization)return {...base,records:[{id:'org-a',organizationGroup:'org-a',title:'Acme',fields:[{label:'Users',value:'26'}]}]};
            if(recordId){if(!window.__retried){window.__retried=true;throw new Error('Details temporarily unavailable')};return {...base,records:[{id:recordId,title:'Member '+page,status:'ACTIVE',fields:[{label:'User ID',value:recordId},{label:'National ID',value:'12345678'}]}]};}
            return {...base,records:[{id:'member-'+page,title:'Member '+page,status:'ACTIVE',fields:[{label:'Email',value:'member@example.test'}]}]};
          }`,
      }));
    } }],
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.getByRole("button", { name: "Acme", exact: true }).click();
    await page.getByRole("button", { name: "Member 1", exact: true }).waitFor();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Member 2", exact: true }).click();
    await page.getByText("Details temporarily unavailable", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Retry user details", exact: true }).click();
    await page.getByRole("dialog").getByText("12345678", { exact: true }).waitFor();
    await page.getByRole("dialog").getByText("member-2", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Back to Acme users", exact: true }).click();
    await page.getByRole("button", { name: "Member 2", exact: true }).waitFor();
    assert.equal(await page.getByRole("dialog").count(), 0);
    const requests = await page.evaluate(() => (window as any).__requests);
    assert.ok(requests.some((r: any) => r.organization === 'org-a' && r.page === 2 && !r.recordId));
    assert.ok(requests.some((r: any) => r.organization === 'org-a' && r.recordId === 'member-2'));
    await page.getByRole("button", { name: "All organizations", exact: true }).click();
    await page.getByRole("button", { name: "Acme", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Member 2", exact: true }).count(), 0);
  } finally { await browser.close(); }
});
