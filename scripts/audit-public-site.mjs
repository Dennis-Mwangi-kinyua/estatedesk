/** Read-only deployment smoke audit. No authenticated pages or payment requests. */
import { writeFile } from "node:fs/promises";
const base = new URL(process.env.AUDIT_BASE_URL || "https://estatedesk.co.ke");
const paths = ["/", "/login", "/services", "/pricing", "/contact", "/guides", "/stays", "/service-providers", "/property-management-software-kenya", "/property-management-software-dubai", "/property-management-software-middle-east", "/guides/manage-kenyan-rentals-from-uae", "/property-management-software-africa", "/remote-property-management-software", "/robots.txt", "/sitemap-index.xml", "/sitemap.xml"];
const results = [];
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
const report = { checkedAt: new Date().toISOString(), base: base.origin, results };
const output = process.env.AUDIT_OUTPUT || "/tmp/estatedesk-public-site-audit.json";
await writeFile(output, JSON.stringify(report, null, 2));
for (const result of results) console.log(`${result.errors.length ? "FAIL" : "PASS"} ${result.path}: ${result.errors.join(", ") || result.status}`);
console.log(`Report: ${output}`);
if (results.some(result => result.errors.length)) process.exitCode = 1;
