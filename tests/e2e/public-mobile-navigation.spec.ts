import { expect, test } from "playwright/test";

test("public navigation works before JavaScript loads", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/property-management-software-middle-east`);
    const menu = page.locator(".public-mobile-navigation");
    await expect(menu.locator("summary")).toBeEnabled();
    await menu.locator("summary").click();
    await expect(menu).toHaveAttribute("open", "");
    await expect(menu.getByRole("link", { name: "Pricing", exact: true })).toBeVisible();
    await menu.getByRole("link", { name: "Pricing", exact: true }).click();
    await expect(page).toHaveURL(/\/pricing$/);
  } finally { await context.close(); }
});

test("hydrated public menu traps focus, closes and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/property-management-software-middle-east");
  const toggle = page.getByRole("button", { name: "Open menu", exact: true });
  await toggle.click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(page.locator("header").getByRole("button", { name: /Switch to (light|dark) mode/ })).toHaveCount(1);
  await expect(dialog.getByRole("button", { name: /Switch to (light|dark) mode/ })).toHaveCount(0);
  await expect.poll(() => page.locator("main > section").first().evaluate(element => getComputedStyle(element).filter)).toContain("blur");
  await expect.poll(() => dialog.evaluate(e => e.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(e => e.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.locator("main > section").first().evaluate(element => getComputedStyle(element).filter)).toBe("none");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".public-mobile-navigation")).not.toHaveAttribute("open", "");
});

test("public tablet fields keep readable text and minimum height", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 768, height: 1024 });
  for (const path of ["/contact", "/register", "/forgot-password", "/service-providers/register", "/vacancies", "/stays"]) {
    await page.goto(path);
    const fields = page.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea');
    for (const field of await fields.all()) {
      if (!await field.isVisible()) continue;
      const box = await field.boundingBox();
      expect(box?.height, `${path}: field target height`).toBeGreaterThanOrEqual(44);
      expect(await field.evaluate(e => parseFloat(getComputedStyle(e).fontSize)), `${path}: text size`).toBeGreaterThanOrEqual(16);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
  }
});

test("shared public actions fit mobile layouts in both themes", async ({ page }) => {
  test.setTimeout(180_000);
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ["/", "/pricing", "/services", "/contact", "/property-management-software-middle-east"]) {
      await page.goto(path);
      for (const dark of [false, true]) {
        await page.evaluate(value => {
          document.documentElement.classList.remove("light", "dark");
          document.documentElement.classList.add(value ? "dark" : "light");
          document.documentElement.style.colorScheme = value ? "dark" : "light";
        }, dark);
        const actions = page.locator(".public-action:visible");
        expect(await actions.count(), path).toBeGreaterThan(0);
        for (const action of await actions.all()) {
          const box = await action.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
          expect(box!.x).toBeGreaterThanOrEqual(-1);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
          expect(await action.evaluate(e => getComputedStyle(e).backgroundImage)).toBe("none");
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} ${width} dark=${dark}`).toBe(true);
      }
    }
  }
});
