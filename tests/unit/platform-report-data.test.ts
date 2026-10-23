import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { reportPeriod } from "../../apps/web/src/lib/reports/period";
const require = createRequire(import.meta.url);
async function fixture() {
  const calls: { model: string; args: any }[] = [];
  const range = reportPeriod({ reportPeriod: "month" });
  const orgs = [{ id: "a", name: "Alpha", currencyCode: "KES", createdAt: new Date(range.current.gte.getTime() + 1) }, { id: "b", name: "Beta", currencyCode: "USD", createdAt: new Date(range.previous.gte.getTime() + 1) }];
  const tx = new Proxy({}, { get: (_, model: string) => ({
    findMany: async (args: any) => { calls.push({ model, args }); return orgs.filter(org => !args.where.id || args.where.id === org.id); },
    groupBy: async (args: any) => {
      calls.push({ model, args }); const current = args.where.createdAt?.gte?.getTime() === range.current.gte.getTime();
      let rows: any[];
      if (model === "payment") rows = [{ orgId: "a", _count: { _all: current ? 3 : 1 }, _sum: { amount: current ? "100.10" : "50.05" } }, { orgId: "b", _count: { _all: 2 }, _sum: { amount: "25.20" } }];
      else if (model === "subscription") rows = [{ orgId: "a", status: args.where.status ?? "ACTIVE", _count: { _all: 1 } }];
      else if (model === "issueTicket") rows = [{ orgId: "a", status: "OPEN", _count: { _all: 2 } }];
      else rows = [{ orgId: "a", status: args.where.status ?? "QUEUED", _count: { _all: 4 } }];
      return rows.filter(row => !args.where.org.id || row.orgId === args.where.org.id);
    },
  }) });
  const db = { $transaction: async (work: (tx: object) => unknown, options: any) => { assert.equal(options.isolationLevel, "RepeatableRead"); return work(tx); } };
  const bundle = await build({ entryPoints: ["apps/web/src/lib/reports/platform.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "report-fixture", setup(builder) {
    builder.onResolve({ filter: /^server-only$|^@\/lib\/prisma$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "server-only" ? "" : "export const prisma=db;", loader: "js" }));
  } }] });
  const mod = { exports: {} as typeof import("../../apps/web/src/lib/reports/platform") };
  new Function("require", "module", "exports", "db", bundle.outputFiles[0].text)(require, mod, mod.exports, db);
  return { report: mod.exports.platformReport, calls, orgs };
}
test("complete report periods retain precise currency totals, previous activity and current backlog", async () => {
  const { report, calls } = await fixture();
  const result = await report({ platformRole: "SUPER_ADMIN" }, { reportPeriod: "month", page: 1, metric: "payment-volume" });
  const payment = result.records.find(row => row.id === "payment-volume")!;
  assert.equal(payment.fields.find(f => f.label === "Verified volume · KES")?.value, "100.10");
  assert.equal(payment.fields.find(f => f.label === "Previous volume · KES")?.value, "50.05");
  assert.equal(payment.fields.find(f => f.label === "Verified volume · USD")?.value, "25.20");
  assert.equal(result.report.organizations.length, 2);
  assert.equal(result.report.organizations[0].current, 3);
  assert.equal(result.report.organizations[0].previous, 1);
  assert.equal(result.report.organizations[0].attention, 7);
  for (const query of calls.filter(c => c.model === "payment")) {
    assert.equal(query.args.where.gatewayStatus, "SUCCESS"); assert.equal(query.args.where.reversedAt, null);
    assert.deepEqual(query.args.where.verificationStatus.in, ["VERIFIED", "NOT_REQUIRED"]);
    assert.equal(query.args.where.org.deletedAt, null); assert.equal(query.args.take, undefined);
  }
});
test("organization drilldown scopes every query, denies unprivileged accounts, and does not silently truncate exports", async () => {
  const { report, calls, orgs } = await fixture();
  await assert.rejects(report({ platformRole: "USER" }, { reportPeriod: "month", page: 1, metric: "organizations" }), /administrator/);
  assert.equal(calls.length, 0);
  const scoped = await report({ platformRole: "PLATFORM_ADMIN" }, { reportPeriod: "month", page: 1, metric: "payment-volume", organization: "b" });
  assert.deepEqual(scoped.report.organizations.map(row => row.id), ["b"]);
  assert.ok(calls.every(c => c.model === "organization" ? c.args.where.id === "b" : c.args.where.org.id === "b"));
  await assert.rejects(report({ platformRole: "SUPER_ADMIN" }, { reportPeriod: "month", page: 1, metric: "organizations", organization: "missing" }), /unavailable/);
  // Keep fixture records strictly inside the report's half-open time window.
  const createdAt = orgs[0].createdAt; for (let index = 0; index < 5001; index++) orgs.push({ id: `org-${index}`, name: `Org ${index}`, currencyCode: "KES", createdAt });
  const page = await report({ platformRole: "SUPER_ADMIN" }, { reportPeriod: "month", page: 2, metric: "organizations" });
  assert.equal(page.report.organizations.length, 25); assert.equal(page.report.hasMore, true);
  await assert.rejects(report({ platformRole: "SUPER_ADMIN" }, { reportPeriod: "month", page: 1, metric: "organizations" }, true), /5,000/);
});
