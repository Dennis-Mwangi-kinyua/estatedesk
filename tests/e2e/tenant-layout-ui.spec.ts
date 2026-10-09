import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
import { installWorkspaceStyles } from "./workspace-styles";

test("tenant dashboard and profile have balanced cards and mobile layouts", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const bundle = await build({
    entryPoints: [path.resolve("tests/e2e/fixtures/tenant-layout.tsx")], bundle: true, write: false,
    platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
    plugins: [{ name: "tenant-layout-fixture", setup(builder) {
      const mocks: Record<string, string> = {
        "next/link": 'import React from "react"; export default function Link({prefetch,...props}){return React.createElement("a",props)}',
        "next/image": 'import React from "react"; export default function Image({unoptimized,fill,...props}){return React.createElement("img",props)}',
        "next/navigation": 'export const useRouter=()=>({refresh(){}}); export const usePathname=()=>"/dashboard/tenant";',
        "@/lib/public-id": 'export const encodePublicId=(id,scope)=>`${scope}--ed_${id}`;',
        "@/lib/ledger": 'export const formatLedgerCurrency=value=>`KES ${Number(value).toLocaleString()}`; export const formatLedgerDate=value=>new Date(value).toISOString().slice(0,10);',
        "@/features/auth/actions/logout-action": 'export async function logoutAction(){}',
        "@/app/(app)/profile/actions": 'export async function updateProfilePicture(){return {success:true,message:"Saved"}}',
        "../actions": 'export async function verifyTenantPassword(){return {ok:true}}',
      };
      builder.onResolve({filter: /^(next\/(link|image|navigation)|@\/lib\/(public-id|ledger)|@\/features\/auth\/actions\/logout-action|@\/app\/\(app\)\/profile\/actions|\.\.\/actions)$/}, args => ({path: args.path, namespace: "fixture"}));
      builder.onLoad({filter: /.*/,namespace:"fixture"},args=>({contents:mocks[args.path],loader:"js",resolveDir:process.cwd()}));
    }}],
  });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(href=>`<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system ed-mobile-first"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  const dashboard = page.locator('[data-layout="dashboard"]');
  const profile = page.locator('[data-layout="profile"]');
  await expect(dashboard.getByRole("heading", {name:"Your shortcuts"})).toBeVisible();
  await expect(profile.getByRole("heading", {name:"Profile picture"})).toBeVisible();
  await expect(dashboard.getByText("PAYMENT123",{exact:false})).toHaveCount(3);
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({width,height:900});
    for(const theme of ["light","dark"]) {
      await page.locator("html").evaluate((el,value)=>el.setAttribute("class", value),theme);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const metricColumns = await dashboard.locator(".tenant-summary-grid").first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").filter(track => parseFloat(track) > 0).length);
      if (width < 480) expect(metricColumns).toBe(1);
      else {
        expect(metricColumns).toBeGreaterThanOrEqual(2);
        expect(metricColumns).toBeLessThanOrEqual(4);
      }
      const metricsFit = await dashboard.locator(".tenant-summary-grid > *").evaluateAll(elements => elements.every(el => el.scrollWidth <= el.clientWidth + 1));
      expect(metricsFit).toBe(true);
      const cards = await profile.locator(':scope > div > div.grid > section').evaluateAll(elements => elements.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,top:r.top,height:r.height}}));
      expect(cards.length).toBeGreaterThanOrEqual(5);
      if(width===1440) {
        expect(Math.abs(cards[0].width-cards[1].width)).toBeLessThan(2);
        expect(Math.abs(cards[0].top-cards[1].top)).toBeLessThan(2);
        expect(Math.abs(cards[0].height-cards[1].height)).toBeLessThan(2);
      }
      await page.screenshot({path:testInfo.outputPath(`tenant-${width}-${theme}.png`),fullPage:true});
    }
  }
  expect(errors).toEqual([]);
});
