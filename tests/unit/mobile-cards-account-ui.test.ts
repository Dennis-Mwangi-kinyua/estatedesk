import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);

for (const platform of ["android", "ios"]) test(`${platform}: native cards fit narrow screens and logout works from Account`, async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{FeatureCard}from'./apps/mobile/src/components/feature-card';import{AccountPage}from'./apps/mobile/src/components/account-page';import{cardGridLayout}from'./apps/mobile/src/grid-layout';
    const titles=['Bills & payments','Completion reports','Identity verification','Service agreements'];
    const width=window.innerWidth-40;const layout=cardGridLayout(width,window.__fontScale||1);
    const session={fullName:'Example Operator',organizationName:'Example Properties',role:'MANAGER',platformRole:'USER'};
    createRoot(document.getElementById('root')).render(<><div data-testid="cards" style={{display:'flex',flexWrap:'wrap',gap:12}}>{titles.map(title=><FeatureCard key={title} title={title} description="Review your records and available actions." icon="folder" style={{width:layout.cellWidth}} onPress={()=>window.__opened=title}/>)}</div><AccountPage session={session} busy={false} logout={()=>window.__logout=true} open={screen=>window.__screen=screen}/></>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", alias: { react: path.dirname(require.resolve("react/package.json")) }, define: { "process.env.NODE_ENV": '"test"' },
    plugins: [{ name: "native-hosts", setup(builder) {
      builder.onResolve({ filter: /^react-native$|^\.\/app-icon$|^\.\.\/(api|photos)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents: args.path === "./app-icon" ? `import React from'react';export const AppIcon=()=> <span aria-hidden="true">◈</span>;export const IconTile=()=> <span aria-hidden="true" style={{display:'block',width:48,height:48}}>◈</span>;`
        : args.path === "../api" ? `export const updateProfilePicture=async()=>{};export const deleteProfilePicture=async()=>{};`
        : args.path === "../photos" ? `export const pickPhoto=async()=>null;export const removePickedPhoto=()=>{};` : `import React from'react';
      function style(value){const result=Object.assign({},...[value].flat(Infinity).filter(Boolean));if(typeof result.lineHeight==='number')result.lineHeight=result.lineHeight+'px';return result;}
      export const View=({children,style:s})=><div style={{display:'flex',flexDirection:'column',...style(s)}}>{children}</div>;
      export const Text=({children,style:s,accessibilityRole})=><span role={accessibilityRole==='header'?'heading':undefined} style={style(s)}>{children}</span>;
      export const Pressable=({children,style:s,accessibilityLabel,disabled,onPress})=><button aria-label={accessibilityLabel} disabled={disabled} onClick={onPress} style={{display:'flex',flexDirection:'column',textAlign:'left',boxSizing:'border-box',fontFamily:'inherit',...style(typeof s==='function'?s({pressed:false}):s)}}>{children}</button>;
      export const TextInput=()=> <input/>;export const ActivityIndicator=()=> <span>Loading</span>;export const Alert={alert(){}};export const Image=({style:s})=><img style={style(s)}/>;export const StyleSheet={create:v=>v};export const Platform={OS:'${platform}'};export const PixelRatio={get:()=>2};export const useWindowDimensions=()=>({width:innerWidth,fontScale:1});` }));
    } }],
  });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 390, 768]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent('<style>body{margin:0;padding:20px;font-family:Arial}#root{display:flex;flex-direction:column;gap:28px}*{box-sizing:border-box}</style><div id="root"></div>');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.getByRole("button", { name: "Bills & payments", exact: true }).waitFor();
      const cards = await page.locator('[data-testid="cards"] > button').evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }));
      assert.equal(cards.length, 4);
      for (const card of cards) assert.ok(card.left >= 20 && card.right <= width - 19, `${platform} ${width}: card fits container`);
      assert.equal(cards[0].top, cards[1].top);
      assert.ok(cards[0].right <= cards[1].left);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.getByRole("button", { name: "Completion reports", exact: true }).click();
      assert.equal(await page.evaluate(() => (window as any).__opened), "Completion reports");
      await page.getByRole("button", { name: "Security", exact: true }).click();
      assert.equal(await page.evaluate(() => (window as any).__screen), "security");
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      assert.equal(await page.evaluate(() => (window as any).__logout), true);
      await page.screenshot({ path: `/private/tmp/estatedesk-${platform}-cards-account-${width}.png`, fullPage: true });
      await page.close();
    }
  } finally { await browser.close(); }
});
