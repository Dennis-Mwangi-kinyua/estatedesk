import {test,expect} from "playwright/test";
test("public SEO has canonical metadata, indexable pages, PNG sharing and private crawl exclusions",async({page,request})=>{
  for(const route of ["/","/pricing","/services","/contact"]){const response=await page.goto(route);expect(response?.status()).toBe(200);await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",new RegExp(route==="/"?'https?://[^/]+/?$':`${route}$`));await expect(page.locator('meta[name="description"]')).toHaveAttribute("content",/.+/);await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content",/noindex/);}
  const image=await request.get("/opengraph-image");expect(image.status()).toBe(200);expect(image.headers()["content-type"]).toContain("image/png");
  const robots=await request.get("/robots.txt");const text=await robots.text();for(const path of ["/dashboard","/platform","/profile"]){expect(text).toContain(`Disallow: ${path}`);}expect(text).toContain("Sitemap:");
});
