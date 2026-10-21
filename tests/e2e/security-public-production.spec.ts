import { expect, test } from "playwright/test";

test("login executes trusted framework scripts and rejects injected inline scripts", async ({ page }) => {
  const response = await page.goto("/login");
  const csp = response!.headers()["content-security-policy"];
  expect(csp).toContain("'nonce-");
  const scriptPolicy = csp.split(";").find(part => part.trim().startsWith("script-src "))!;
  expect(scriptPolicy).not.toContain("unsafe-inline");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.locator('#password')).toHaveAttribute("type", "text");
  const blocked = await page.evaluate(async () => {
    const violations: string[] = [];
    document.addEventListener("securitypolicyviolation", event => violations.push(event.violatedDirective));
    const script = document.createElement("script");
    script.textContent = "window.__injectedScriptExecuted = true";
    document.body.appendChild(script);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { ran: Boolean((window as unknown as Record<string, unknown>).__injectedScriptExecuted), violations };
  });
  expect(blocked.ran).toBe(false);
  expect(blocked.violations.some(value => value.startsWith("script-src"))).toBe(true);
});

test("detailed health and private APIs do not disclose data to anonymous visitors", async ({ request }) => {
  for (const path of ["/api/health?deep=1", "/api/org/subscription-invoices/example", "/api/receipts/example"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});


test("forged signed-cookie shapes reach login without exposing a protected workspace", async ({ page, context }) => {
  const value = `v1.${"a".repeat(64)}.${"b".repeat(32)}`;
  // Raw headers exercise forged signatures even on HTTP localhost, where
  // Chromium refuses creating a Secure __Host- cookie through addCookies.
  await context.setExtraHTTPHeaders({ cookie: `__Host-estatedesk_session=${value}; estatedesk_session=${value}` });
  for (const path of ["/dashboard/org", "/platform", "/provider", "/print/owner-statements"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(page.getByLabel("Email or username")).toBeVisible();
  }
});
