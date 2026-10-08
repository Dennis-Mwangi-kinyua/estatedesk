import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
test("profile pictures appear after login and uploads preview and validate before saving", async ({ page }) => {
  page.on("pageerror", error => console.error("Profile fixture error:", error.message));
  const bundle = await build({
    entryPoints: [path.resolve("tests/e2e/fixtures/profile-picture.tsx")], bundle: true, write: false,
    platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [{ name: "profile-mocks", setup(builder) {
      builder.onResolve({ filter: /^next\/(image|link|navigation)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onResolve({ filter: /\/profile\/actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/image" ? 'import React from "react"; export default function Image({unoptimized, ...props}) {return React.createElement("img", props);}' : args.path === "next/link" ? 'import React from "react"; export default function Link(props) {return React.createElement("a", props);}' : args.path === "next/navigation" ? 'export const useRouter = () => ({refresh(){}});' : 'export async function updateProfilePicture(_state, form) {await new Promise(resolve => setTimeout(resolve, 150)); window.savedProfilePhoto = form.get("photo").name; return {success:true, message:"Profile picture updated."};}', loader: "js", resolveDir: process.cwd() }));
    } }],
  });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  await page.setContent('<html><head></head><body><div id="fixture"></div></body></html>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(page.getByRole("link", {name:"My profile"}).locator("img")).toHaveAttribute("src", /imagedelivery.net/);
  await expect(page.getByRole("button", {name:"Save picture"})).toBeDisabled();
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name:"invalid.txt", mimeType:"text/plain", buffer:Buffer.from("invalid") });
  await expect(page.getByRole("alert")).toContainText("Choose a JPG");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1sAAAAASUVORK5CYII=", "base64");
  await input.setInputFiles({ name:"new-photo.png", mimeType:"image/png", buffer:png });
  await expect(page.getByRole("img", {name:"Preview of your new profile picture"})).toBeVisible();
  await page.getByRole("button", {name:"Discard selected photo"}).click();
  await expect(page.getByRole("button", {name:"Save picture"})).toBeDisabled();
  await input.setInputFiles({ name:"new-photo.png", mimeType:"image/png", buffer:png });
  await page.getByRole("button", {name:"Save picture"}).click();
  await expect(page.getByRole("status")).toContainText("Profile picture updated.");
  expect(await page.evaluate(() => (window as unknown as {savedProfilePhoto:string}).savedProfilePhoto)).toBe("new-photo.png");
});
