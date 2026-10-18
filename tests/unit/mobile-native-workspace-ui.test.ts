import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
for (const kind of ["organization", "platform"] as const) test(`native ${kind} records open details, paginate, search and recover from a failed read`, async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {NativeWorkspace} from './apps/mobile/src/components/native-workspace'; createRoot(document.getElementById('root')).render(<NativeWorkspace target={{kind:'${kind}',path:'/dashboard/org/tenants',title:'Tenants',description:'Tenant directory',emoji:'users'}} open={()=>{}} onError={()=>{window.__unauthorized=true}}/>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", alias: { react: path.dirname(require.resolve("react/package.json")) },
    define: { "process.env.NODE_ENV": '"test"' },
    plugins: [{ name: "native-hosts", setup(builder) {
      builder.onResolve({ filter: /^react-native$|^react-native-safe-area-context$|^\.\/app-icon$|^\.\/native-action-form$|^\.\.\/api$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
        args.path === "react-native" ? `import React from 'react';
          export const View=({children})=><div>{children}</div>;
          export const Modal=({children})=><div role="dialog">{children}</div>;
          export const ScrollView=View;
          export const Text=({children,accessibilityRole})=><span role={accessibilityRole==='alert'?'alert':undefined}>{children}</span>;
          export const Pressable=({children,onPress,disabled,accessibilityLabel,accessibilityState})=><button aria-label={accessibilityLabel} aria-expanded={accessibilityState?.expanded} disabled={disabled} onClick={onPress}>{children}</button>;
          export const TextInput=({value,onChangeText,accessibilityLabel,...props})=><input aria-label={accessibilityLabel} value={value} onChange={event=>onChangeText(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')props.onSubmitEditing?.()}}/>;
          export const ActivityIndicator=()=> <span>Loading</span>;
          export const StyleSheet={create:value=>value};export const Platform={OS:'ios'};export const Keyboard={dismiss(){}};export const PixelRatio={get:()=>2};export const useWindowDimensions=()=>({width:834,fontScale:1});`
          : args.path === "react-native-safe-area-context" ? `import React from "react"; export const SafeAreaView=({children})=><div>{children}</div>;`
          : args.path === "./native-action-form" ? `import React from 'react'; export const NativeActionForm=({request,close})=><div role="dialog" aria-label="Record action"><span>Editing {request.recordId}</span><button onClick={()=>close(false)}>Cancel edit</button></div>;`
          : args.path === "./app-icon" ? `export const AppIcon=()=>null;export const IconTile=()=>null;`
          : `export class ApiError extends Error {status=401};
          export const getHelp=async()=>({records:[],related:[],page:1,hasMore:false});
          export async function getNativeWorkspace(kind,path,q,page){
            window.__calls=(window.__calls||0)+1;
            if(window.__holdRead) await new Promise(resolve=>{window.__releaseRead=resolve});
            if(q==='broken'&&!window.__retried){window.__retried=true;throw new Error('Service temporarily unavailable')}
            return {title:'Tenants',description:'Records',emoji:'users',page,hasMore:page===1,related:[],searchable:true,records:q==='missing'?[]:[{id:'tenant-'+page,title:page===1?'Example Tenant':'Next Tenant',status:'ACTIVE',subtitle:'',actions:[{id:'record.edit',title:'Edit record'}],fields:[{label:'Phone',value:'Fixture phone'},{label:'Email',value:'Fixture email'},{label:'Notes',value:'More evidence'}]},...page===1?[{id:'inactive',title:'Inactive Tenant',status:'INACTIVE',subtitle:'',fields:[]}]:[]]};
          }`,
      }));
    } }],
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.getByRole("button", { name: "Example Tenant", exact: true }).waitFor();
    await page.getByRole("button", { name: "Filter INACTIVE", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Example Tenant", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Inactive Tenant", exact: true }).waitFor();
    await page.getByRole("button", { name: "Show all statuses", exact: true }).click();
    assert.equal(await page.getByText("More evidence", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Example Tenant", exact: true }).click();
    await page.getByText("More evidence", { exact: true }).waitFor();
    {
      await page.getByRole("dialog").waitFor();
      await page.getByRole("button", { name: "Edit record", exact: true }).click();
      await page.getByText("Editing tenant-1", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Cancel edit", exact: true }).click();
      await page.getByText("More evidence", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Back to Tenants", exact: true }).click();
      assert.equal(await page.getByRole("dialog").count(), 0);
      await page.getByRole("button", { name: "Example Tenant", exact: true }).waitFor();
    }
    // Refreshing must retain the list and any detail opened while the read is pending.
    await page.evaluate(() => { (window as any).__holdRead = true; });
    await page.getByRole("button", { name: "Refresh records", exact: true }).click();
    await page.waitForFunction(() => Boolean((window as any).__releaseRead));
    await page.getByRole("button", { name: "Example Tenant", exact: true }).click();
    await page.getByText("More evidence", { exact: true }).waitFor();
    await page.evaluate(() => { (window as any).__holdRead = false; (window as any).__releaseRead(); });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(button => button.textContent === 'Refresh records' && !button.disabled));
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Back to Tenants", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next Tenant", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Next", exact: true }).isDisabled(), true);
    await page.getByRole("textbox", { name: "Search Tenants" }).fill("missing");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByText("No matching records", { exact: true }).waitFor();
    await page.getByRole("textbox", { name: "Search Tenants" }).fill("broken");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByText("Service temporarily unavailable", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await page.getByRole("button", { name: "Example Tenant", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => (window as Window & { __unauthorized?: boolean }).__unauthorized), undefined);
  } finally { await browser.close(); }
});
