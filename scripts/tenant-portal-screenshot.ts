import { chromium } from "playwright";

const [cookieHeader, targetUrl, outfile] = process.argv.slice(2);

if (!cookieHeader || !targetUrl || !outfile) {
  console.error(
    "Usage: tenant-portal-screenshot.ts <cookie-header> <url> <outfile>",
  );
  process.exit(2);
}

const [cookieName, ...cookieValueParts] = cookieHeader.split("=");
const cookieValue = cookieValueParts.join("=");
const parsedUrl = new URL(targetUrl);

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHROME_CHANNEL ?? "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    userAgent: process.env.QA_USER_AGENT ?? "tenant-portal-visual-qa",
  });

  await context.addCookies([
    {
      name: cookieName,
      value: cookieValue,
      domain: parsedUrl.hostname,
      path: "/",
      httpOnly: true,
      secure: parsedUrl.protocol === "https:",
      sameSite: "Strict",
    },
  ]);

  const page = await context.newPage();
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: outfile, fullPage: true });
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});