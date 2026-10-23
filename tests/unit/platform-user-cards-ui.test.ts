import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
test("native user cards open an organization, retain its filter and return to organizations", async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {NativeWorkspace} from './apps/mobile/src/components/native-workspace'; createRoot(document.getElementById('root')).render(<NativeWorkspace target={{kind:'platform',path:'/platform/users',title:'User accounts',description:'People',emoji:'users'}} open={()=>{}} onBack={()=>{}} onError={()=>{}}/>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", alias: { react: path.dirname(require.resolve("react/package.json")) },
    define: { "process.env.NODE_ENV": '"test"' },
    plugins: [{ name: "native-directory-hosts", setup(builder) {
      builder.onResolve({ filter: /^react-native$|^react-native-safe-area-context$|^\.\/app-icon$|^\.\/native-action-form$|^\.\.\/api$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
        args.path === "react-native" ? `import React from 'react'; export const View=({children})=><div>{children}</div>;export const ScrollView=View;export const Modal=({children})=><div role="dialog">{children}</div>;export const Text=({children})=><span>{children}</span>;export const Pressable=({children,onPress,disabled,accessibilityLabel})=><button aria-label={accessibilityLabel} disabled={disabled} onClick={onPress}>{children}</button>;export const TextInput=({value,onChangeText,accessibilityLabel})=><input aria-label={accessibilityLabel} value={value} onChange={event=>onChangeText(event.target.value)}/>;export const ActivityIndicator=()=>null;export const StyleSheet={create:value=>value};export const Platform={OS:'android'};export const Keyboard={dismiss(){}};export const PixelRatio={get:()=>2};export const useWindowDimensions=()=>({width:390,fontScale:1});`
          : args.path === "react-native-safe-area-context" ? `import React from 'react';export const SafeAreaView=({children})=><div>{children}</div>;`
          : args.path === "./native-action-form" ? `export const NativeActionForm=()=>null;`
          : args.path === "./app-icon" ? `export const AppIcon=()=>null;export const IconTile=()=>null;`
          : `export class ApiError extends Error {status=401}; export const getHelp=async()=>({records:[],related:[],page:1,hasMore:false});
            export async function getNativeWorkspace(kind,path,q,page,recordId,organization){
              window.__directoryQuery={q,page,organization};
              return {page,hasMore:!!organization&&page===1,related:[],searchable:true,records:organization?[{id:recordId||'user-'+page,title:(recordId==='user-2'||page===2)?'Next User':'Jane Example',subtitle:'Resident',status:'ACTIVE',fields:[{label:'Email',value:'jane@example.test'},{label:'Organization',value:'Example Estates'}]}]:[{id:'org-a',organizationGroup:'org-a',title:'Example Estates',subtitle:'example',fields:[{label:'Users',value:'52'}]},{id:'none',organizationGroup:'__unassigned__',title:'No organization',subtitle:'Unassigned accounts',fields:[{label:'Users',value:'3'}]}]};
            }`,
      }));
    } }],
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.getByRole("button", { name: "Example Estates", exact: true }).click();
    await page.getByRole("button", { name: "Jane Example", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "No organization", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next User", exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => (window as any).__directoryQuery), { q: "", page: 2, organization: "org-a" });
    await page.getByRole("button", { name: "Next User", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Back to Example Estates users", exact: true }).click();
    await page.getByRole("button", { name: "All organizations", exact: true }).click();
    await page.getByRole("button", { name: "No organization", exact: true }).click();
    await page.getByRole("button", { name: "Jane Example", exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => (window as any).__directoryQuery), { q: "", page: 1, organization: "__unassigned__" });
  } finally { await browser.close(); }
});
