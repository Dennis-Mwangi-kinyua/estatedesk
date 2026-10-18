import { readFile } from "node:fs/promises";
import { test, expect } from "playwright/test";
import { configureTestDatabase } from "../integration/database-safety";

const portal = "/api/mobile/tenant/portal?path=%2Fdashboard%2Ftenant%2Frewards";
const native = { "X-EstateDesk-Client": "native" };

test("management summaries and native portals require authentication for both workspace kinds", async ({ request }) => {
  for (const kind of ["organization", "platform"]) {
    const summary = await request.get(`/api/mobile/workspace?kind=${kind}`, { headers: native });
    expect(summary.status()).toBe(401);
    const bootstrap = await request.get(`/api/mobile/workspace/portal?kind=${kind}`, { headers: { ...native, Accept: "text/html", "Sec-Fetch-Site": "none", "Sec-Fetch-Dest": "document" }, maxRedirects: 0 });
    expect(bootstrap.status()).toBe(401);
    expect(bootstrap.headers()["set-cookie"]).toBeUndefined();
  }
});

test("tenant browser bootstrap requires a session even with native navigation headers", async ({ request }) => {
  const response = await request.get(portal, { headers: { ...native, Accept: "text/html", "Sec-Fetch-Site": "none", "Sec-Fetch-Dest": "document" }, maxRedirects: 0 });
  expect(response.status()).toBe(401);
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

test("ordinary browser navigation cannot bootstrap a native tenant workspace", async ({ request }) => {
  const response = await request.get(portal, { headers: { Accept: "text/html", "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "document" }, maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/are-you-lost");
});

test("tenant bootstrap installs an HttpOnly cookie and reuses the web workspace", async ({ request, page }) => {
  test.skip(!process.env.ROLE_WORKSPACE_FIXTURE || !process.env.TEST_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL, "Requires fictional tenant fixture and an explicitly selected local test backend");
  configureTestDatabase();
  const fixture = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8"));
  const account = fixture.accounts.TENANT;
  const login = await request.post("/api/mobile/login", { headers: native, data: { email: account.email, password: account.password } });
  expect(login.status()).toBe(200);
  const cookie = (await login.json()).sessionCookie as string;
  try {
    const bootstrap = await request.get(portal, { headers: { ...native, Cookie: cookie, Accept: "text/html", "Sec-Fetch-Site": "none" } });
    expect(bootstrap.status()).toBe(200);
    const html = await bootstrap.text();
    expect(html).toContain("/dashboard/tenant/rewards");
    expect(html).not.toContain(cookie.split("=")[1]);
    expect(bootstrap.headers()["set-cookie"]).toMatch(/HttpOnly/i);
    expect(bootstrap.headers()["cache-control"]).toContain("no-store");
    await page.route("**/api/mobile/tenant/portal?*", route => route.continue({ headers: { ...route.request().headers(), ...native, Cookie: cookie, "sec-fetch-site": "none" } }));
    await page.goto(portal);
    await expect(page).toHaveURL(/\/dashboard\/tenant\/rewards/);
    expect(await page.evaluate(() => document.cookie)).not.toContain(cookie.split("=")[0]);
  } finally {
    await request.post("/api/mobile/logout", { headers: { ...native, Cookie: cookie } });
  }
});
