import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { createRequire } from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);

// Exercise the real App shell. These native host stand-ins reproduce the
// installed ScrollView's different iOS child positions / Android wrapper when
// refreshControl is added or removed. The stateful child exposes remounts.
const native = `
import React, {forwardRef, useImperativeHandle} from 'react';
export const Platform = {OS: window.__platform};
export const useWindowDimensions = () => ({width:834,height:1210,fontScale:1});
export const StyleSheet = {create: value => value};
export const Keyboard = {dismiss(){},addListener(){return {remove(){}}}};
export const View = ({children}) => <div>{children}</div>;
export const Text = ({children}) => <span>{children}</span>;
export const Pressable = ({children,onPress,disabled}) => <button disabled={disabled} onClick={onPress}>{children}</button>;
export const TextInput = () => <input />;
export const ActivityIndicator = () => <span>Loading</span>;
export const InputAccessoryView = View;
export const KeyboardAvoidingView = View;
export const Linking = {openURL: async () => {}};
export const RefreshControl = ({children}) => <aside>{children}</aside>;
export const ScrollView = forwardRef(({children,refreshControl},ref) => {
  useImperativeHandle(ref,()=>({scrollTo(){}}));
  const content = <article>{children}</article>;
  if (refreshControl != null) {
    return Platform.OS === 'ios'
      ? <section>{refreshControl}{content}</section>
      : React.cloneElement(refreshControl, {}, <section>{content}</section>);
  }
  return <section>{content}</section>;
});`;

const workflow = `
import React, {useState,useEffect} from 'react';
export function Workflows({onNavigationChange,onError}) {
  const [screen,setScreen]=useState('home');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{ window.__mounts=(window.__mounts||0)+1; },[]);
  useEffect(()=>{onNavigationChange(screen,busy)},[screen,busy,onNavigationChange]);
  function openBill() {
    setScreen('bills'); setBusy(true);
    setTimeout(()=>{setBusy(false);onError(new Error('Service unavailable'))},30);
  }
  return <div data-testid="workflow">
    <output data-testid="screen">{screen}</output>
    {screen==='home' ? <><button onClick={()=>setScreen('help')}>Help card</button><button onClick={openBill}>Bills card</button></>
      : <button onClick={()=>setScreen('home')}>Back</button>}
  </div>;
}`;

test("iOS and Android retain the selected service when refresh availability changes", async () => {
  const bundleFor = (legacy = false) => build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import App from './apps/mobile/App'; createRoot(document.getElementById('root')).render(<App/>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic",
    alias: { react: path.dirname(require.resolve("react/package.json")) },
    define: { "process.env.NODE_ENV": '"test"' },
    plugins: [{ name: "native-hosts", setup(builder) {
      if (legacy) builder.onLoad({ filter: /apps\/mobile\/App\.tsx$/ }, args => ({
        loader: "tsx", resolveDir: path.dirname(args.path),
        contents: readFileSync(args.path, "utf8").replace(
          /refreshControl=\{(<RefreshControl[^\n]+\/>)\}/,
          'refreshControl={session?.role === "TENANT" && tenantHome.visible && !offline && !session.requiresAccountSetup ? $1 : undefined}',
        ),
      }));
      builder.onResolve({ filter: /^(react-native|react-native-safe-area-context|expo-status-bar)$|^\.\/src\/(api|components\/(app-icon|workflows|app-error-boundary|offline-workspace|tenant-workspace|tenant-navigation|native-guest-stay|native-vacancies|native-password-recovery))(\.tsx?)?$|^\.\/(app-icon|workflows|app-error-boundary|offline-workspace|tenant-workspace|tenant-navigation|native-guest-stay|native-vacancies|native-password-recovery)(\.tsx?)?$/ }, args => ({ path: args.path, namespace: "native-test" }));
      builder.onLoad({ filter: /.*/, namespace: "native-test" }, args => ({
        loader: "tsx", resolveDir: process.cwd(), contents:
          args.path === "react-native" ? native
          : args.path === "react-native-safe-area-context" ? `export {View as SafeAreaView, View as SafeAreaProvider} from 'react-native';`
          : args.path === "expo-status-bar" ? `export const StatusBar=()=>null;`
          : args.path.includes("app-icon") ? `export const AppIcon=()=>null;export const IconTile=()=>null;`
          : args.path.endsWith("/workflows") ? workflow
          : args.path === "./src/api" ? `export class ApiError extends Error {};
            export const hasSavedSession=async()=>true;
            export const getSession=async()=>({userId:'fixture',organizationId:'org',role:'TENANT',platformRole:'USER',requiresAccountSetup:false});
            export const getCachedSession=getSession; export const signIn=async()=>{}; export const signOut=async()=>{}; export const websiteUrl=()=>'';`
          : args.path.endsWith("app-error-boundary") ? `export const AppErrorBoundary=({children})=>children;`
          : args.path.endsWith("tenant-navigation") ? `export const TenantNavigation=()=>null;`
          : args.path.endsWith("tenant-workspace") ? `export const TenantWorkspace=()=>null;`
          : args.path.endsWith("native-guest-stay") ? `export const NativeGuestStay=()=>null;`
          : args.path.endsWith("native-vacancies") ? `export const NativeVacancies=()=>null;`
          : args.path.endsWith("native-password-recovery") ? `export const NativePasswordRecovery=()=>null;`
          : `export const OfflineWorkspace=()=>null;`,
      }));
    } }],
  });
  const bundle = await bundleFor();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const platform of ["ios", "android"]) {
      const page = await browser.newPage();
      try {
        await page.setContent('<div id="root"></div>');
        await page.evaluate(value => { (window as any).__platform = value; }, platform);
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        await page.getByRole("button", { name: "Help card" }).click();
        await page.waitForTimeout(100);
        assert.equal(await page.getByTestId("screen").textContent(), "help", `${platform}: local screen must remain open`);
        const mounts = await page.evaluate(() => (window as any).__mounts);
        await page.getByRole("button", { name: "Back", exact: true }).click();
        await page.getByRole("button", { name: "Bills card" }).click();
        await page.getByText("Service unavailable", { exact: true }).waitFor();
        assert.equal(await page.getByTestId("screen").textContent(), "bills", `${platform}: failed request must not reset navigation`);
        assert.equal(await page.evaluate(() => (window as any).__mounts), mounts, `${platform}: shell must not remount workflow`);
      } finally { await page.close(); }
    }
    // Negative control: restoring the former conditional child reproduces the
    // user's dormant-card symptom without modifying the running app's files.
    const legacy = await bundleFor(true);
    const page = await browser.newPage();
    try {
      await page.setContent('<div id="root"></div>');
      await page.evaluate(() => { (window as any).__platform = "ios"; });
      await page.addScriptTag({ content: legacy.outputFiles[0].text });
      await page.getByRole("button", { name: "Help card" }).click();
      await page.waitForTimeout(100);
      assert.equal(await page.getByTestId("screen").textContent(), "home", "former refresh-control removal must reproduce the reset");
      assert.ok(await page.evaluate(() => (window as any).__mounts > 1));
    } finally { await page.close(); }
  } finally { await browser.close(); }
});
