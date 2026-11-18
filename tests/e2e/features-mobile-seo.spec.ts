import { expect, test } from "playwright/test";
import { productFeatures } from "../../apps/web/src/lib/product-features";

test("feature content and structured data are available without JavaScript", async ({ browser, baseURL, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/features`);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/features$/);
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
    for (const feature of productFeatures) await expect(page.locator(`#${feature.id} h2`)).toHaveText(feature.title);
    const data = await page.locator('main script[type="application/ld+json"]').textContent();
    expect(JSON.parse(data!).itemListElement).toHaveLength(productFeatures.length);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain("/features</loc>");
    const discovery = await request.get("/llms.txt");
    expect(await discovery.text()).toContain("Security Centre and privacy requests");
  } finally { await context.close(); }
});

test("public pages fit small phones through desktop and enlarged text", async ({ page }) => {
  test.setTimeout(180_000);
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/features", "/pricing", "/contact"]) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} at ${width}`).toBe(true);
    }
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/features");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("basic overview works without scripts, images, fonts or stylesheets", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 240, height: 320 } });
  const resources: string[] = [];
  try {
    const page = await context.newPage();
    page.on("request", request => resources.push(request.resourceType()));
    await page.goto(`${baseURL}/basic.html`);
    await expect(page.locator("h1")).toHaveText("Your properties, rent and team. One workspace.");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
    expect(resources.filter(type => ["script", "image", "font", "stylesheet"].includes(type))).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.getByRole("link", { name: "Contact the team", exact: true })).toHaveAttribute("href", "/contact");
  } finally { await context.close(); }
});
