import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";

for (const workspace of ["tenant", "org"]) {
  test(`${workspace} names wrap in full and header clears content on narrow screens`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const mocks: Record<string, string> = {
      "next/link": 'import React from "react"; export default function Link({prefetch,...props}){return React.createElement("a",props)}',
      "next/image": 'import React from "react"; export default function Image({unoptimized,fill,...props}){return React.createElement("img",props)}',
      "next/navigation": `export const usePathname=()=>"/dashboard/${workspace}"; export const useRouter=()=>({refresh(){}});`,
      "@/features/auth/actions/logout-action": 'export async function logoutAction(){}',
      "@/components/uploads/profile-picture-context": 'export const useProfilePicture=()=>null;',
      "@/app/(app)/platform/support-access/actions": 'export async function leaveOrgSupportAccessAction(){} export async function extendOrgSupportAccessAction(){}',
      "./theme-provider": 'export const useTheme=()=>({resolvedTheme:"light",setTheme(){}});',
    };
    const bundle = await build({
      entryPoints: [path.resolve("tests/e2e/fixtures/mobile-names.tsx")], bundle: true, write: false,
      platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
      define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
      plugins: [{ name: "mobile-shell-mocks", setup(builder) {
        builder.onResolve({ filter: /^(next\/(link|image|navigation)|@\/features\/auth\/actions\/logout-action|@\/components\/uploads\/profile-picture-context|@\/app\/\(app\)\/platform\/support-access\/actions|\.\/theme-provider)$/ }, args => ({ path: args.path, namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "js", resolveDir: process.cwd() }));
      } }],
    });
    await page.goto(`/register?workspace=${workspace}`);
    await page.waitForLoadState("networkidle");
    const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
    await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system ed-mobile-first"><div id="fixture"></div></body></html>`);
    await installWorkspaceStyles(page);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const width of [320, 360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      for (const theme of ["light", "dark"]) {
        await page.locator("html").evaluate((el, value) => el.setAttribute("class", value), theme);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        const header = page.locator("header");
        await expect(header).toBeVisible();
        const issues = await page.evaluate(() => {
          const header = document.querySelector("header")!;
          const visible = (el: Element) => !!el.getClientRects().length;
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            clippedNames: Array.from(header.querySelectorAll("h1, .workspace-identity p:first-child")).filter(visible).filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map(el => el.textContent),
            contentCovered: header.getBoundingClientRect().bottom > document.querySelector("[data-content-start]")!.getBoundingClientRect().top + 1,
          };
        });
        expect(issues).toEqual({ overflow: false, clippedNames: [], contentCovered: false });
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
        expect((await header.boundingBox())!.y).toBeGreaterThanOrEqual(-1);
        await page.getByRole("button", { name: "Last page action" }).scrollIntoViewIfNeeded();
        if (workspace === "tenant" && width < 1024) {
          await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
          const action = await page.getByRole("button", { name: "Last page action" }).boundingBox();
          const dock = await page.getByRole("navigation", { name: "Tenant quick navigation" }).boundingBox();
          expect(action!.y + action!.height).toBeLessThan(dock!.y);
        }
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.screenshot({ path: testInfo.outputPath(`${workspace}-${width}-${theme}.png`) });
      }
    }
    expect(errors).toEqual([]);
  });
}
