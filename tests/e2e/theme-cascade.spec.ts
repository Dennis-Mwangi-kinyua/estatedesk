import { test, expect } from "playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";

let css: string;
let appearanceFixture: string;
let toggleFixture: string;
test.beforeAll(async () => {
  const base = path.resolve("apps/web/src/app");
  const globals = path.join(base, "globals.css");
  const compiled = await postcss([tailwind()]).process(readFileSync(globals, "utf8"), { from: globals });
  css = compiled.css + ["system-glass.css", "modern-ui.css", "site-experience.css", "soft-ui.css", "theme-controls.css", "public-workspace.css", "(app)/workspace.css", "(app)/workspace-controls.css", "(app)/platform/platform-glass.css", "(app)/platform/admin-glass.css"]
    .map(file => readFileSync(path.join(base, file), "utf8")).join("\n");
  const bundle = await build({ entryPoints: ["tests/e2e/fixtures/platform-appearance.tsx"], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json" });
  appearanceFixture = bundle.outputFiles[0].text;
  const toggles = await build({ entryPoints: ["tests/e2e/fixtures/theme-toggle.tsx"], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json" });
  toggleFixture = toggles.outputFiles[0].text;
});

test("actual public and workspace theme toggles keep contrasting icons and switch both ways", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.route("http://theme-controls.test/**", route => route.fulfill({ contentType: "text/html", body: `<html><head><style>${css}</style></head><body class="estate-glass-system"><div id="root"></div><script>${toggleFixture}</script></body></html>` }));
  await page.goto("http://theme-controls.test/");
  for (const theme of ["light", "dark"] as const) {
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    for (const id of ["public-toggle", "workspace-toggle"]) {
      const button = page.locator(`#${id} button`);
      await expect(button).toBeVisible();
      const ratio = await button.evaluate(element => {
        const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d", { willReadFrequently: true })!;
        const luminance = (color: string) => { context.fillStyle = color; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0); };
        const values = [luminance(getComputedStyle(element).backgroundColor), luminance(getComputedStyle(element.querySelector("svg")!).color)].sort((a, b) => b - a);
        return (values[0] + .05) / (values[1] + .05);
      });
      expect(ratio, `${id} ${theme} icon contrast`).toBeGreaterThanOrEqual(4.5);
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(40);
      expect(box!.height).toBeGreaterThanOrEqual(40);
    }
    await page.locator("#public-toggle button").click();
  }
  await expect(page.locator("html")).toHaveClass(/light/);
});

for (const saved of ["light", "dark"] as const) {
  test(`Classic and Glass switch independently of the saved ${saved} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: saved === "light" ? "dark" : "light" });
    await page.addInitScript(saved => {
      if (!localStorage.getItem("theme")) localStorage.setItem("theme", saved);
    }, saved);
    await page.route("http://appearance.test/**", route => route.fulfill({
      contentType: "text/html",
      body: `<html><head><style>${css}</style></head><body class="estate-glass-system"><div id="root"></div><script>${appearanceFixture}</script></body></html>`,
    }));
    await page.goto("http://appearance.test/platform");
    await expect(page.locator("html")).toHaveClass(new RegExp(saved));
    await expect(page.locator('button[aria-label^="Switch to"]')).toBeVisible();
    await page.getByRole("button", { name: "Glass", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/light/);
    await expect(page.locator(".platform-ui-glass")).toBeVisible();
    await expect(page.locator('button[aria-label^="Switch to"]')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(saved);
    expect(await page.evaluate(() => document.cookie)).toContain(`estatedesk-theme=${saved}`);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/light/);
    await expect(page.getByRole("button", { name: "Glass", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(saved);
    await page.getByRole("button", { name: "Classic", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(new RegExp(saved));
    await expect(page.locator(".platform-ui-glass")).toHaveCount(0);
    await expect(page.locator('button[aria-label^="Switch to"]')).toBeVisible();
    await expect(page.locator("#appearance-panel")).toHaveCSS("backdrop-filter", "none");
    await page.getByRole("button", { name: "Glass", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/light/);
    await page.getByRole("button", { name: "Leave platform", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(new RegExp(saved));
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(saved);
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`platform admin glass has one appearance with a ${theme} device theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.setContent(`<html class="light"><head><style>${css} *,*::before,*::after{transition:none!important}</style></head>
      <body class="estate-glass-system"><div class="estate-workspace"><div class="platform-shell-admin platform-ui-glass" style="min-height:100vh;padding:24px">
        <header class="platform-desktop-header ed-shell-panel" style="padding:20px;border-radius:20px"><p class="text-muted-foreground">ESTATEDESK · PLATFORM ADMIN</p><h1 style="font-size:28px;margin-top:8px">Platform overview</h1></header>
        <main style="max-width:1100px;margin:24px auto">
          <section class="page-header" style="padding:24px"><p class="text-muted-foreground">Your workspace, at a glance</p><h2 style="font-size:24px;margin:8px 0">A clear view of your operations.</h2><p class="text-muted-foreground">Sample preview · Organizations, activity and platform health.</p></section>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:20px;margin-top:20px">
            <article id="admin-card" class="platform-glass-panel" style="padding:24px"><p class="text-muted-foreground">Organizations</p><h2 style="font-size:36px;margin:16px 0">128</h2><p>All workspaces in one place</p></article>
            <article class="platform-glass-panel" style="padding:24px"><p class="text-muted-foreground">Platform health</p><h2 style="font-size:28px;margin:16px 0">Operational</h2><p>Monitor services and activity</p></article>
          </div>
          <section class="workspace-panel" style="padding:24px;margin-top:20px"><h2 style="font-size:20px;margin-bottom:16px">Find an organization</h2><input id="admin-input" placeholder="Search by name" style="padding:12px;border:1px solid;border-radius:12px;width:100%;max-width:420px">
            <div class="platform-mode-switch" style="display:flex;gap:8px;margin-top:20px"><button aria-pressed="true" style="padding:12px 20px">Admin</button><button aria-pressed="false" style="padding:12px 20px">Developer</button></div>
          </section>
        </main>
      </div></div></body></html>`);
    await expect(page.locator("#admin-card")).toHaveCSS("backdrop-filter", "blur(20px) saturate(1.25)");
    await expect(page.locator("#admin-card")).toHaveCSS("background-color", "rgba(255, 255, 255, 0.52)");
    await expect(page.locator("#admin-input")).toHaveCSS("background-color", "rgba(255, 255, 255, 0.94)");
    const active = page.locator('[aria-pressed="true"]');
    const inactive = page.locator('[aria-pressed="false"]');
    expect(await active.evaluate(el => getComputedStyle(el).backgroundColor)).not.toEqual(await inactive.evaluate(el => getComputedStyle(el).backgroundColor));
    const contrast = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const luminance = () => [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3)
        .map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
        .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
      return [...document.querySelectorAll("#admin-card p, #admin-card h2, #admin-input, .platform-mode-switch button")].map(element => {
        ctx.clearRect(0, 0, 1, 1);
        const ancestors = [];
        for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
        for (const node of ancestors) {
          ctx.fillStyle = getComputedStyle(node).backgroundColor;
          ctx.fillRect(0, 0, 1, 1);
        }
        const background = luminance();
        ctx.fillStyle = getComputedStyle(element).color;
        ctx.fillRect(0, 0, 1, 1);
        const text = luminance();
        return (Math.max(text, background) + .05) / (Math.min(text, background) + .05);
      });
    });
    for (const ratio of contrast) expect(ratio).toBeGreaterThanOrEqual(4.5);
    await page.screenshot({ path: `/tmp/estatedesk-admin-glass-${theme}.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "reduce" }] });
    await expect(page.locator("#admin-card")).toHaveCSS("backdrop-filter", "none");
    await expect(page.locator("#admin-card")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  });
}

for (const deviceTheme of ["light", "dark"] as const) {
  test(`public and dashboard colors follow the selected theme with a ${deviceTheme} device theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: deviceTheme, reducedMotion: "reduce" });
    await page.setContent(`<html class="light"><head><style>${css} *,*::before,*::after{transition:none!important}</style></head>
      <body class="estate-glass-system"><header class="modern-public-header"></header>
      ${["public", "workspace"].map(scope => `<main class="${scope === "workspace" ? "estate-workspace org-theme-content" : ""}">
        <article id="${scope}-card" class="bg-card text-card-foreground">Card</article>
        <article id="${scope}-explicit" class="bg-white text-slate-950 dark:bg-slate-900 dark:text-white">Explicit colors</article>
        <a id="${scope}-inverse" class="bg-slate-950 text-white dark:bg-white dark:text-slate-950">Inverse action</a>
        <input id="${scope}-input" class="bg-background text-foreground" value="Input">
        <button id="${scope}-button" class="bg-primary text-primary-foreground"><span class="text-slate-950 dark:text-white">Action label</span></button>
      </main>`).join("")}</body></html>`);
    for (const theme of ["light", "dark", "light"] as const) {
      await page.evaluate(value => document.documentElement.className = value, theme);
      for (const scope of ["public", "workspace"]) {
        await expect(page.locator(`#${scope}-card`)).toHaveCSS("background-color", theme === "dark" ? "rgb(32, 34, 39)" : "rgb(255, 255, 255)");
        const contrasts = await page.evaluate(scope => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d", { willReadFrequently: true })!;
          const luminance = (color: string) => {
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
              .map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
              .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
          };
          return ["card", "explicit", "inverse", "input", "button"].map(id => {
            const element = document.getElementById(`${scope}-${id}`)!;
            const text = getComputedStyle(element.firstElementChild ?? element).color;
            const background = getComputedStyle(element).backgroundColor;
            const values = [luminance(text), luminance(background)].sort((a, b) => b - a);
            return { id, ratio: (values[0] + .05) / (values[1] + .05) };
          });
        }, scope);
        for (const { id, ratio } of contrasts) expect(ratio, `${scope} ${theme} ${id}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
}
