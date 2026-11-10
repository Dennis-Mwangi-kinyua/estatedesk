import { expect, test } from "playwright/test";

test("offline shell stays readable and usable on small phones, tablets and large text", async ({ page }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 480 });
      await page.goto("/offline-shell.html");
      await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
      const retry = page.getByRole("link", { name: "Try EstateDesk again" });
      expect(await retry.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (colorScheme === "dark") {
        expect(await page.locator("main").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(15, 23, 42)");
      }
      await page.locator("html").evaluate(el => { el.style.fontSize = "200%"; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await retry.scrollIntoViewIfNeeded();
      await expect(retry).toBeInViewport();
      await retry.focus();
      await expect(retry).toBeFocused();
    }
  }
});

test.describe("installed PWA recovery", () => {
  test.use({ serviceWorkers: "allow" });
  test("offline navigation shows recovery without caching private pages and reconnects", async ({ page, context }) => {
    await page.goto("/login");
    await page.evaluate(async () => {
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
    });
    await context.setOffline(true);
    try {
      await page.goto("/dashboard/org/crm", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
      const cachedPaths = await page.evaluate(async () => {
        const paths: string[] = [];
        for (const name of await caches.keys()) {
          const cache = await caches.open(name);
          for (const request of await cache.keys()) paths.push(new URL(request.url).pathname);
        }
        return paths;
      });
      expect(cachedPaths.filter(path => /^\/(?:api|dashboard|platform)(?:\/|$)/.test(path))).toEqual([]);
    } finally { await context.setOffline(false); }
    await page.getByRole("link", { name: "Try EstateDesk again" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
