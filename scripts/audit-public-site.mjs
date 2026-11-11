/** Read-only deployment smoke audit. No authenticated pages or payment requests. */
import { writeFile } from "node:fs/promises";
const base = new URL(process.env.AUDIT_BASE_URL || "https://estatedesk.co.ke");
const paths = ["/rent-collection-software", "/property-management-onboarding", "/", "/login", "/services", "/pricing", "/contact", "/guides", "/stays", "/service-providers", "/property-management-software-kenya", "/property-management-software-dubai", "/property-management-software-middle-east", "/guides/manage-kenyan-rentals-from-uae", "/property-management-software-africa", "/remote-property-management-software", "/robots.txt", "/sitemap-index.xml", "/sitemap.xml"];
const results = [];
// Audit the entire published static catalog, not just a hand-picked sample.
try {
  const response = await fetch(new URL("/sitemap.xml", base), { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Static sitemap returned ${response.status}`);
  const xml = await response.text();
  for (const [, location] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(location.replaceAll("&amp;", "&"));
    if (!paths.includes(url.pathname + url.search)) paths.push(url.pathname + url.search);
  }
} catch (error) { results.push({ path: "/sitemap.xml discovery", errors: [error.message] }); }
for (const path of ["/careers", "/sitemap-careers.xml", "/sitemap-stays.xml", "/sitemap-service-providers.xml", "/sitemap-vacancies.xml", "/sitemap-vacancy-pages.xml", "/sitemap-rental-landings.xml"]) {
  if (!paths.includes(path)) paths.push(path);
}
for (const path of paths) {
  const started = performance.now();
  try {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
    const html = await response.text();
    const result = { path, status: response.status, durationMs: Math.round(performance.now() - started), bytes: Buffer.byteLength(html), headers: Object.fromEntries(["cache-control", "content-security-policy", "strict-transport-security", "x-content-type-options", "x-frame-options", "x-vercel-cache"].map(key => [key, response.headers.get(key)])), errors: [] };
    if (response.status !== 200) result.errors.push("Non-200 response");
    if (!path.endsWith(".txt") && !path.endsWith(".xml")) {
      for (const [name, pattern] of [["title", /<title>[^<]+<\/title>/], ["description", /<meta name="description" content="[^"]+"/], ["canonical", /<link rel="canonical" href="https?:\/\/[^" ]+"/]]) if (!pattern.test(html)) result.errors.push(`Missing ${name}`);
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
      const expected = new URL(path, base).href;
      if (canonical && new URL(canonical).href !== expected) result.errors.push(`Canonical mismatch: expected ${expected}, got ${canonical}`);
      if (/<meta[^>]+name="(?:robots|googlebot)"[^>]+content="[^"]*noindex/i.test(html) || /noindex/i.test(response.headers.get("x-robots-tag") || "")) result.errors.push("Public page is noindex");
      if (!/<h1(?:\s|>)/i.test(html)) result.errors.push("Missing primary heading");
      for (const property of ["og:title", "og:description", "og:url", "og:image"]) {
        if (!html.includes(`property="${property}"`)) result.errors.push(`Missing ${property}`);
      }
      const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
      for (const [, text] of scripts) { try { JSON.parse(text); } catch { result.errors.push("Invalid JSON-LD"); } }
      if (path !== "/login" && !scripts.length) result.errors.push("Missing JSON-LD");
    }
    results.push(result);
  } catch (error) { results.push({ path, errors: [error.message] }); }
}
for (const path of ["/opengraph-image", "/careers?q=manager", "/careers?page=2", "/careers/does-not-exist-seo-audit"]) {
  try {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
    const text = await response.text();
    const errors = [];
    const expectedStatus = path.includes("does-not-exist") ? 404 : 200;
    if (response.status !== expectedStatus) errors.push(`Expected ${expectedStatus}, got ${response.status}`);
    if (path === "/opengraph-image" && !response.headers.get("content-type")?.startsWith("image/png")) errors.push("Sharing image must be PNG");
    if (path.includes("?q=") && !/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(text)) errors.push("Search results must be noindex");
    if (path.includes("?page=2") && !/<link rel="canonical" href="[^"]*\/careers\?page=2"/.test(text)) errors.push("Page two must have its own canonical");
    results.push({ path, status: response.status, errors });
  } catch (error) { results.push({ path, errors: [error.message] }); }
}
const report = { checkedAt: new Date().toISOString(), base: base.origin, results };
const output = process.env.AUDIT_OUTPUT || "/tmp/estatedesk-public-site-audit.json";
await writeFile(output, JSON.stringify(report, null, 2));
for (const result of results) console.log(`${result.errors.length ? "FAIL" : "PASS"} ${result.path}: ${result.errors.join(", ") || result.status}`);
console.log(`Report: ${output}`);
if (results.some(result => result.errors.length)) process.exitCode = 1;
