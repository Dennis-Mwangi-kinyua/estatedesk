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
