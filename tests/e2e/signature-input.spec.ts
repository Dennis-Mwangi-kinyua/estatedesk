import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";

test("signature pad supports drawing, clearing, switching methods, and touch", async ({ page, isMobile }) => {
  const bundle = await build({ entryPoints: [path.resolve("tests/e2e/fixtures/signature-input.tsx")], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' } });
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>canvas{width:100%;aspect-ratio:3/1;touch-action:none}body{margin:16px}button,label{display:block;margin:10px 0}</style><div id="fixture"></div><output id="result"></output>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.getByRole("button", { name: "Save signature" }).click();
  await expect(page.getByRole("alert")).toContainText("Draw your signature");
  await expect(page.locator("#result")).toBeEmpty();
  const canvas = page.getByLabel("Draw your signature", { exact: true });
  const box = (await canvas.boundingBox())!;
  if (isMobile) {
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + 20, y: box.y + 20 }] });
    for (let i = 1; i <= 5; i++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + 20 + i * 15, y: box.y + 20 + i * 5 }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 50, { steps: 10 }); await page.mouse.up();
  }
  await expect(page.locator('p[role="status"]')).toContainText("ready");
  const before = await page.locator('input[name="signatureData"]').inputValue();
  expect(before).toMatch(/^data:image\/png;base64,/);
  await page.getByLabel("Type name", { exact: true }).check();
  await page.getByLabel("Draw signature", { exact: true }).check();
  expect(await page.locator('input[name="signatureData"]').inputValue()).toBe(before);
  await page.getByRole("button", { name: "Save signature" }).click();
  await expect(page.locator("#result")).toContainText('"signatureMethod":"DRAWN"');
  await page.getByRole("button", { name: "Clear signature" }).click();
  await expect(page.locator('input[name="signatureData"]')).toHaveValue("");
  await page.getByLabel("Type name", { exact: true }).check();
  await page.getByRole("button", { name: "Save signature" }).click();
  await expect(page.locator("#result")).toContainText('"signatureMethod":"TYPED"');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
