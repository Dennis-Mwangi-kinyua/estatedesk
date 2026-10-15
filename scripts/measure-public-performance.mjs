/** Reproducible browser lab sample, not real-user Core Web Vitals or a Lighthouse score. */
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const base = process.env.AUDIT_BASE_URL || "https://estatedesk.co.ke";
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const results = [];
try {
  for (const path of ["/", "/login", "/services"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__lab = { lcpMs: null, cls: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__lab.lcpMs = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__lab.cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
    });
    const response = await page.goto(new URL(path, base).href, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(3000);
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return { ...window.__lab, ttfbMs: nav.responseStart - nav.startTime, domContentLoadedMs: nav.domContentLoadedEventEnd, transferredBytes: performance.getEntriesByType("resource").reduce((sum, entry) => sum + entry.transferSize, nav.transferSize), horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
    });
    results.push({ path, status: response?.status(), ...metrics });
    await context.close();
  }
} finally { await browser.close(); }
const report = { checkedAt: new Date().toISOString(), base, method: "Single cold browser sample per route; mobile viewport; 4x CPU slowdown; 150ms latency; 1.6Mbps download. Three-second observation after DOM readiness. CLS is a page-load sample, not session-window field CLS; INP is not measured. Results depend on runner geography.", results };
const output = process.env.AUDIT_OUTPUT || "/tmp/estatedesk-mobile-lab.json";
await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
