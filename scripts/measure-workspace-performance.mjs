/** Local authenticated browser lab; state files must come from fictional test accounts. */
import { chromium, devices } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
const base = process.env.AUDIT_BASE_URL || "http://127.0.0.1:3107";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("Workspace lab is restricted to local test servers.");
const fixture = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE || "/tmp/estatedesk-role-workspaces.json", "utf8"));
const browser = await chromium.launch();
const results = [];
try {
  for (const role of ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "TENANT", "LANDLORD", "SECURITY", "PLATFORM_ADMIN", "PROVIDER"]) {
    const context = await browser.newContext({ ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, storageState: `/tmp/estatedesk-role-state-${role}.json`, serviceWorkers: "block" });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__lab = { lcpMs: null, cls: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__lab.lcpMs = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__lab.cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
    });
    const response = await page.goto(new URL(fixture.accounts[role].home, base).href, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      return { ...window.__lab, ttfbMs: nav.responseStart, transferredBytes: resources.reduce((sum, r) => sum + r.transferSize, nav.transferSize), scriptTransferBytes: resources.filter(r => r.initiatorType === "script").reduce((sum, r) => sum + r.transferSize, 0), horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    const ax = await cdp.send("Accessibility.getFullAXTree");
    const unnamedControls = ax.nodes.filter(node => !node.ignored && ["button", "textbox", "combobox"].includes(node.role?.value) && !node.name?.value).map(node => ({ role: node.role.value, nodeId: node.backendDOMNodeId }));
    results.push({ unnamedControls, role, path: fixture.accounts[role].home, finalPath: new URL(page.url()).pathname, status: response?.status(), ...metrics });
    await context.close();
  }
} finally { await browser.close(); }
const report = { checkedAt: new Date().toISOString(), base, method: "Single cold browser-context sample per role, warmed local server, small fictional dataset, 390x844, 4x CPU, 150ms latency, 1.6Mbps. Three-second observation after DOM readiness. Not field Core Web Vitals, capacity proof or production speed comparison.", results };
await writeFile(process.env.AUDIT_OUTPUT || "/tmp/estatedesk-workspace-performance.json", JSON.stringify(report, null, 2));
console.log("Workspace browser lab recorded.");
if (results.some(r => r.status !== 200 || r.finalPath !== r.path || r.horizontalOverflow)) process.exitCode = 1;
