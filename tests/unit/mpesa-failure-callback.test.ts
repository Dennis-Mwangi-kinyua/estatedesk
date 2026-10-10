import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { build } from "esbuild";

test("failed STK callbacks replace acceptance notes without settling funds", async () => {
  const bundle = await build({ entryPoints: [path.resolve("apps/web/src/lib/mpesa/settle-callback.ts")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "callback-fixture", setup(builder) {
    builder.onResolve({ filter: /^(server-only|@\/lib\/payments\/settle-payment)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "server-only" ? "" : 'export const settleGatewayPayment=()=>{throw new Error("Failure must not settle money");};', loader: "js" }));
  } }] });
  const module = { exports: {} as { settleMpesaCallback: (tx: unknown, orgId: string, callback: unknown) => Promise<unknown> } };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
  const payment = { id: "payment", orgId: "org", method: "MPESA_STK", verificationStatus: "NOT_REQUIRED", merchantRequestId: "merchant", callbackRaw: { settlementMode: "gateway" } };
  const writes: any[] = [];
  const tx = { payment: { findUnique: async () => payment, update: async (input: unknown) => writes.push(input) } };
  const callback = { CheckoutRequestID: "checkout", MerchantRequestID: "merchant", ResultCode: 1037, ResultDesc: "DS timeout user cannot be reached." };
  await module.exports.settleMpesaCallback(tx, "org", callback);
  assert.equal(writes[0].data.gatewayStatus, "FAILED");
  assert.equal(writes[0].data.verificationStatus, "REJECTED");
  assert.match(writes[0].data.notes, /could not reach your phone/);
  assert.equal(writes[0].data.reconciliationNotes, writes[0].data.notes);
  assert.deepEqual(writes[0].data.callbackRaw.mpesaCallback, callback);
  assert.equal(writes[0].data.callbackRaw.settlementMode, "gateway");
  await assert.rejects(module.exports.settleMpesaCallback(tx, "another-org", callback));
  assert.equal(writes.length, 1);
  payment.verificationStatus = "VERIFIED";
  await module.exports.settleMpesaCallback(tx, "org", callback);
  assert.equal(writes.length, 1);
});
