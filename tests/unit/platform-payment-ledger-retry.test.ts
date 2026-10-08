import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";

test("platform ledger retries transient water reads and preserves complete totals", async () => {
  const bundle = await build({
    entryPoints: [path.resolve("apps/web/src/lib/ledger.ts")], bundle: true, write: false,
    platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json",
    plugins: [{name: "ledger-fixture", setup(builder) {
      builder.onResolve({filter: /^server-only$/}, () => ({path: "empty", namespace: "fixture"}));
      builder.onResolve({filter: /^@\/lib\/(prisma|notifications\/notify|accounting\/billing)$/}, args => ({path: args.path, namespace: "fixture"}));
      builder.onResolve({filter: /^@\/lib\/db\/retry$/}, () => ({path: path.resolve("packages/db-kit/src/retry.ts")}));
      builder.onLoad({filter: /.*/, namespace: "fixture"}, args => {
        const mocks: Record<string, string> = {
          empty: "",
          "@/lib/notifications/notify": "export const notifyRecipients = () => {};",
          "@/lib/accounting/billing": "export const postRentChargeAccrual = () => {};",
          "@/lib/prisma": `let reads = 0;
            export const prisma = {
              organization: {count: async () => 1, findMany: async () => [{id:"org", name:"Greenview", slug:"greenview"}]},
              tenant: {groupBy: async () => [{orgId:"org", _count:{_all:1}}]},
              rentCharge: {findMany: async () => [{orgId:"org", amountDue:200, balance:100}]},
              waterBill: {findMany: async () => {if (++reads === 1) {const error = new Error("Connection closed"); error.code="P1017"; throw error;} return [{id:"bill",orgId:"org",total:100}];}},
              payment: {findMany: async ({where}) => where.waterBillId ? [{waterBillId:"bill",amount:30,gatewayStatus:"SUCCESS",verificationStatus:"VERIFIED"}] : [{orgId:"org",amount:130,gatewayStatus:"SUCCESS",verificationStatus:"VERIFIED",paidAt:new Date("2026-10-04"),createdAt:new Date("2026-10-04")}]}
            };`,
        };
        return {contents: mocks[args.path], loader:"js", resolveDir:process.cwd()};
      });
    }}],
  });
  const module = {exports: {} as {getPlatformPaymentLedger: (period: string) => Promise<{totals: {expected:number;paid:number;deficit:number}}>}};
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
  const ledger = await module.exports.getPlatformPaymentLedger("2026-10");
  assert.equal(ledger.totals.expected, 300);
  assert.equal(ledger.totals.paid, 130);
  assert.equal(ledger.totals.deficit, 170);
});
