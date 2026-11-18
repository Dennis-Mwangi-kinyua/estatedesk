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
  css = compiled.css + ["system-glass.css", "modern-ui.css", "site-experience.css", "soft-ui.css", "theme-controls.css", "public-workspace.css", "(app)/workspace.css", "(app)/workspace-controls.css", "(app)/platform/platform-glass.css", "brand-tokens.css", "brand-ui.css"]
    .map(file => readFileSync(path.join(base, file), "utf8")).join("\n");
  const bundle = await build({ entryPoints: ["tests/e2e/fixtures/platform-appearance.tsx"], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json" });
  appearanceFixture = bundle.outputFiles[0].text;
  const toggles = await build({ entryPoints: ["tests/e2e/fixtures/theme-toggle.tsx"], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json" });
  toggleFixture = toggles.outputFiles[0].text;
});

test("actual public and workspace theme toggles keep contrasting icons and switch both ways", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.route("http://theme-controls.test/**", route => route.fulfill({ contentType: "text/html", body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body class="estate-glass-system"><div id="root"></div><script>${toggleFixture}</script></body></html>` }));
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
  test(`platform admin keeps one interface and respects the saved ${saved} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: saved === "light" ? "dark" : "light" });
    await page.addInitScript(saved => {
      if (!localStorage.getItem("theme")) localStorage.setItem("theme", saved);
    }, saved);
    await page.route("http://appearance.test/**", route => route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body class="estate-glass-system"><div id="root"></div><script>${appearanceFixture}</script></body></html>`,
    }));
    await page.goto("http://appearance.test/platform");
    await expect(page.locator("html")).toHaveClass(new RegExp(saved));
    await expect(page.getByRole("button", { name: "Classic", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Glass", exact: true })).toHaveCount(0);
    await expect(page.locator(".platform-ui-glass")).toHaveCount(0);
    await expect(page.locator('button[aria-label^="Switch to"]')).toBeVisible();
    await expect(page.locator("#appearance-panel")).toHaveCSS("backdrop-filter", "none");
    const nextTheme = saved === "light" ? "dark" : "light";
    await page.getByRole("button", { name: `Switch to ${nextTheme} mode` }).click();
    await expect(page.locator("html")).toHaveClass(new RegExp(nextTheme));
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(nextTheme);
    await page.getByRole("button", { name: "Leave platform", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(new RegExp(nextTheme));
  });
}

for (const deviceTheme of ["light", "dark"] as const) {
  test(`public and dashboard colors follow the selected theme with a ${deviceTheme} device theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: deviceTheme, reducedMotion: "reduce" });
    await page.setContent(`<html class="light"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css} *,*::before,*::after{transition:none!important}</style></head>
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
        await expect(page.locator(`#${scope}-card`)).toHaveCSS("background-color", theme === "dark" ? "rgb(25, 43, 36)" : "rgb(255, 255, 255)");
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

for (const theme of ['light', 'dark']) {
  test(`EstateDesk action hierarchy and focus remain readable in ${theme}`, async ({ page }) => {
    await page.setContent(`<html class="${theme}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body class="estate-glass-system"><main class="estate-workspace" style="padding:24px"><h1>EstateDesk</h1><p>Your properties. One clear workspace.</p><div style="display:flex;gap:12px;flex-wrap:wrap">${['default','outline','secondary','ghost','destructive'].map(variant => `<button data-slot="button" data-workspace-action="true" data-variant="${variant}">${variant}</button>`).join('')}</div><label>Property name<input aria-label="Property name"></label></main></body></html>`);
    const primary = page.locator('[data-variant="default"]');
    await expect(primary).toHaveCSS('background-color', theme === 'light' ? 'rgb(20, 99, 78)' : 'rgb(121, 213, 180)');
    await expect(page.locator('[data-variant="outline"]')).toHaveCSS('background-color', theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(25, 43, 36)');
    await expect(page.locator('[data-variant="ghost"]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await page.keyboard.press('Tab');
    await expect(primary).toBeFocused();
    await expect(primary).toHaveCSS('outline-style', 'solid');
    expect(await primary.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
