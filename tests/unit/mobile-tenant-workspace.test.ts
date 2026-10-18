import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tenantDocumentPath, tenantNavigation, tenantWorkspaceEntry, tenantWorkspaceLinks } from "../../packages/contracts/src/tenant-workspace";
import { isTenantPortalRequest } from "../../apps/web/src/lib/mobile/portal-policy";

const origin = "https://estatedesk.test";
test("every web tenant navigation entry is reachable from the mobile workspace menu", () => {
  const sidebar = readFileSync(new URL("../../apps/web/src/components/layout/tenant-sidebar-links.ts", import.meta.url), "utf8");
  const paths = [...sidebar.matchAll(/href: "([^"]+)"/g)].map(match => match[1]);
  assert.ok(paths.length >= 17);
  const mobilePaths = new Set<string>(tenantWorkspaceLinks.map(([, path]) => path));
  for (const path of paths) assert.ok(mobilePaths.has(path), `Add mobile entry for ${path}`);
});

test("bootstrap accepts only fixed tenant entry points, with no open redirects or markup injection", () => {
  assert.equal(tenantWorkspaceEntry("/dashboard/tenant/rewards"), "/dashboard/tenant/rewards");
  for (const value of [null, "//attacker.test", "https://attacker.test", "/dashboard/org", "/dashboard/tenant?next=https://attacker.test", '/dashboard/tenant/\"><script>']) {
    assert.equal(tenantWorkspaceEntry(value), "/dashboard/tenant");
  }
});

test("bootstrap permits native navigation metadata but rejects browser fetches and cross-site navigation", () => {
  const make = (headers: Record<string, string>) => new Request(`${origin}/api/mobile/tenant/portal`, { headers });
  const native = { "X-EstateDesk-Client": "native" };
  assert.equal(isTenantPortalRequest(make(native)), true);
  assert.equal(isTenantPortalRequest(make({ ...native, "Sec-Fetch-Site": "none" })), true);
  for (const headers of [{}, { ...native, Origin: origin }, { ...native, Origin: "null" }, { ...native, "Sec-Fetch-Site": "cross-site" }, { ...native, "Sec-Fetch-Site": "same-origin" }]) {
    assert.equal(isTenantPortalRequest(make(headers)), false);
  }
});

test("untrusted navigation never receives native credentials or opens unsafe schemes", () => {
  assert.equal(tenantNavigation(`${origin}/sign-lease/token`, origin), "internal");
  assert.equal(tenantNavigation(`${origin}/dashboard/security`, origin), "internal");
  assert.equal(tenantNavigation(`${origin}/login?expired=1`, origin), "exit");
  for (const url of ["https://external.test", "mailto:office@example.test", "tel:+254700000000"]) assert.equal(tenantNavigation(url, origin), "external");
  for (const url of ["javascript:alert(1)", "data:text/html,test", "file:///etc/passwd", "intent://example", "http://external.test", "https://user:secret@estatedesk.test", "invalid"]) assert.equal(tenantNavigation(url, origin), "blocked");
});

test("authenticated PDF download is restricted to tenant document routes on the configured origin", () => {
  for (const path of ["/api/receipts/receipt-id", "/api/move-outs/notice-id/report", "/dashboard/tenant/lease/lease-id/download", "/dashboard/tenant/inspections/report/download", "/dashboard/tenant/invoice/2026-10/download", "/dashboard/tenant/receipts/receipt-id", "/dashboard/tenant/payments/statement?from=2026-01-01"]) {
    assert.equal(tenantDocumentPath(origin + path, origin), path);
  }
  for (const url of ["https://external.test/dashboard/tenant/receipts/id", `${origin}/dashboard/org/documents/id/download`, `${origin}/api/mobile/session`, `${origin}/dashboard/tenant/lease/a/b/download`, `https://user:secret@estatedesk.test/dashboard/tenant/receipts/id`]) assert.equal(tenantDocumentPath(url, origin), null);
  assert.equal(tenantDocumentPath(`${origin}/dashboard/tenant/lease/%2e%2e/receipts/id`, origin), "/dashboard/tenant/receipts/id");
});
