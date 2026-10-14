import { expect, test } from "playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`login fits laptop screens and keeps ${theme} text readable`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("theme", value), theme);
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      const dimensions = await page.locator("[data-login-page]").evaluate(element => ({ height: element.clientHeight, scrollHeight: element.scrollHeight, width: element.clientWidth, scrollWidth: element.scrollWidth }));
      expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.height + 1);
      expect(dimensions.scrollWidth).toBe(dimensions.width);
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Records & reporting" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeInViewport();
      const contrasts = await page.evaluate(() => {
        const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255);
        const luminance = (value: string) => rgb(value).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
        const ratio = (text: string, background: string) => { const values = [luminance(text), luminance(background)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); };
        const input = document.querySelector<HTMLInputElement>("#email")!;
        const field = input.parentElement!;
        const button = document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
        const description = document.querySelector("aside article p")!;
        return [
          ratio(getComputedStyle(input).color, getComputedStyle(field).backgroundColor),
          ratio(getComputedStyle(input, "::placeholder").color, getComputedStyle(field).backgroundColor),
          ratio(getComputedStyle(button).color, getComputedStyle(button).backgroundColor),
          ratio(getComputedStyle(description).color, getComputedStyle(description.parentElement!).backgroundColor),
        ];
      });
      for (const contrast of contrasts) expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test("theme switching preserves visible login fields and the saved choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/login");
  await page.evaluate(() => localStorage.setItem("theme", "light"));
  await page.reload();
  await page.getByLabel("Email or username").fill("caretaker01");
  await page.getByRole("button", { name: "Change color theme", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByLabel("Email or username")).toHaveValue("caretaker01");
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Change color theme", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
});

for (const theme of ["light", "dark"] as const) {
  test(`mobile login stays accessible from small phones to landscape in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("theme", value), theme);
    for (const viewport of [{width:320,height:568},{width:360,height:640},{width:390,height:844},{width:430,height:932},{width:667,height:375},{width:320,height:320}]) {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      const root = page.locator("[data-login-page]");
      expect(await root.evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await page.getByLabel("Email or username").fill("tenant@example.test");
      await page.getByLabel("Password", {exact:true}).fill("test-password");
      const login = page.getByRole("button", {name:"Log in",exact:true});
      await login.scrollIntoViewIfNeeded();
      await expect(login).toBeInViewport();
      const forgot = page.getByRole("link", {name:"Forgot password?"});
      await forgot.scrollIntoViewIfNeeded();
      await expect(forgot).toBeInViewport();
      const create = page.getByRole("link", {name:"Create one"});
      await create.scrollIntoViewIfNeeded();
      await expect(create).toBeInViewport();
      await expect(page.getByLabel("Email or username")).toHaveValue("tenant@example.test");
    }
  });
}
