/** Read-only anonymous/forged-session checks. Never supplies a real user session. */
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const base = new URL(process.env.AUDIT_BASE_URL || "http://127.0.0.1:3107");
const paths = [
  "/dashboard/org", "/dashboard/tenant", "/dashboard/landlord", "/dashboard/caretaker/today", "/dashboard/gate", "/platform", "/provider", "/profile",
  "/print/owner-statements", "/print/issues/example", "/print/inspections/example",
  "/api/health?deep=1", "/api/mobile/session", "/api/mobile/workspace", "/api/mobile/tenant/documents",
  "/api/org/reports/export?type=rent-roll", "/api/org/reports/reconciliation", "/api/org/subscription-invoices/example",
  "/api/platform/data-exports/example/download", "/api/platform/subscription-invoices/example",
  "/api/data-exports/example/download", "/api/payments/example/proof", "/api/receipts/example", "/api/service-agreements/example",
  "/api/move-outs/example/report", "/api/move-outs/example/refund-proof",
];
const results = [];
for (const identity of ["anonymous", "forged"]) {
  for (const path of paths) {
    const headers = { accept: "application/json" };
    if (identity === "forged") {
      const forged = `v1.${"a".repeat(64)}.${"b".repeat(32)}`;
      headers.cookie = `__Host-estatedesk_session=${forged}; estatedesk_session=${forged}`;
    }
    try {
      const response = await fetch(new URL(path, base), { headers, redirect: "manual", signal: AbortSignal.timeout(15000) });
      const body = await response.text();
      // Next may flush its loading shell before a server guard redirects.
      // Only an explicit framework login/denial redirect qualifies, never a plain 200.
      const streamedTarget = response.status === 200
        ? body.match(/<meta id="__next-page-redirect" http-equiv="refresh" content="[^;]+;url=([^"]+)"/i)?.[1]
        : undefined;
      const streamedDenial = streamedTarget && ["/login", "/access-denied"].includes(new URL(streamedTarget, base).pathname);
      const errors = [];
      if (!streamedDenial && ![301, 302, 303, 307, 308, 401, 403, 404].includes(response.status)) errors.push(`Unexpected status ${response.status}`);
      const location = response.headers.get("location");
      if (location && !["/login", "/access-denied", "/are-you-lost"].includes(new URL(location, base).pathname)) errors.push("Unexpected redirect destination");
      if (!/no-store/.test(response.headers.get("cache-control") || "")) errors.push("Missing no-store");
      if (!/noindex/.test(response.headers.get("x-robots-tag") || "")) errors.push("Missing noindex");
      results.push({ identity, path, status: response.status, ...(streamedDenial ? { streamedRedirect: new URL(streamedTarget, base).pathname } : {}), errors });
    } catch (error) { results.push({ identity, path, errors: [error.message] }); }
  }
}
const report = { checkedAt: new Date().toISOString(), base: base.origin, scope: "Anonymous and invalid-signature sessions only. Does not establish role or organization isolation; use authenticated and integration tests too.", results };
await writeFile(process.env.AUDIT_OUTPUT || "/tmp/estatedesk-private-access.json", JSON.stringify(report, null, 2));
for (const result of results) console.log(`${result.errors.length ? "FAIL" : "PASS"} ${result.identity} ${result.path}${result.errors.length ? `: ${result.errors.join(', ')}` : ''}`);
assert.equal(results.filter(result => result.errors.length).length, 0, "Private access checks failed");
