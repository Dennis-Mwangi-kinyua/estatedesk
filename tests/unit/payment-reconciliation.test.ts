import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { build } from "esbuild";
import { paymentReconciliationBlocker } from "../../apps/web/src/lib/payments/reconciliation-policy";

const require = createRequire(path.resolve("package.json"));

test("reconciliation only accepts successful, verified payments that have not been reversed", () => {
  for (const verificationStatus of ["VERIFIED", "NOT_REQUIRED"]) {
    assert.equal(paymentReconciliationBlocker({ verificationStatus, gatewayStatus: "SUCCESS" }), null);
    for (const gatewayStatus of ["PENDING", "FAILED", "CANCELLED"]) {
      assert.match(paymentReconciliationBlocker({ verificationStatus, gatewayStatus })!, /successful/);
    }
  }
  for (const verificationStatus of ["PENDING", "REJECTED", "REVERSED"]) {
    assert.ok(paymentReconciliationBlocker({ verificationStatus, gatewayStatus: "SUCCESS" }));
  }
  assert.match(paymentReconciliationBlocker({ verificationStatus: "VERIFIED", gatewayStatus: "SUCCESS", reversedAt: new Date() })!, /Reversed/);
});

async function loadReconcileAction(fixture: Record<string, unknown>) {
  const bundle = await build({ entryPoints: [path.resolve("apps/web/src/app/(app)/dashboard/org/payments/_lib/reconciliation-actions.ts")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "reconciliation-action-fixture", setup(builder) {
    builder.onResolve({ filter: /^(next\/navigation|@\/lib\/(prisma|audit\/security)|\.\/payment-action-shared)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/navigation" ? 'export const redirect=fixture.redirect;' : args.path.endsWith("prisma") ? 'export const prisma=fixture.db;' : args.path.endsWith("security") ? 'export const writeAuditLog=fixture.audit;' : 'export const requirePaymentManager=fixture.authorize; export const revalidatePaymentSurfaces=fixture.revalidate; export const readString=(form,key)=>String(form.get(key)??"").trim(); export const paymentsMessageUrl=(message,messageType="success")=>"/dashboard/org/payments?"+new URLSearchParams({message,messageType});', loader: "js", resolveDir: process.cwd() }));
  } }] });
  const module = { exports: {} as { reconcilePaymentAction: (form: FormData) => Promise<void> } };
  new Function("require", "module", "exports", "fixture", bundle.outputFiles[0].text)(require, module, module.exports, fixture);
  return module.exports.reconcilePaymentAction;
}

test("reconcile action redirects invalid and stale submissions without changing payments or auditing success", async () => {
  let payment: any = null;
  let writes = 0;
  let audits = 0;
  let count = 1;
  let authorized = 0;
  let lastWrite: any;
  const action = await loadReconcileAction({
    authorize: async () => { authorized++; return { activeOrgId: "org-1", userId: "manager" }; },
    revalidate: () => {},
    redirect: (url: string) => { throw Object.assign(new Error("redirect"), { url }); },
    audit: async () => { audits++; },
    db: { payment: {
      findFirst: async (input: any) => { assert.equal(input.where.orgId, "org-1"); return payment; },
      updateMany: async (input: any) => { writes++; lastWrite = input; return { count }; },
    } },
  });
  const form = new FormData();
  const expectRedirect = async (message: RegExp, type = "error") => {
    await assert.rejects(action(form), (error: any) => {
      const url = new URL(error.url, "https://example.test");
      assert.equal(url.pathname, "/dashboard/org/payments");
      assert.equal(url.searchParams.get("messageType"), type);
      assert.match(url.searchParams.get("message")!, message);
      return true;
    });
  };
  await expectRedirect(/id is required/);
  form.set("paymentId", "payment-1");
  await expectRedirect(/not found/);
  for (const status of ["PENDING", "REJECTED", "REVERSED"]) {
    payment = { id: "payment-1", verificationStatus: status, gatewayStatus: "SUCCESS" };
    await expectRedirect(/Verify|Rejected|Reversed/);
  }
  payment = { id: "payment-1", verificationStatus: "NOT_REQUIRED", gatewayStatus: "PENDING" };
  await expectRedirect(/successful/);
  assert.equal(writes, 0);
  assert.equal(audits, 0);
  payment = { id: "payment-1", verificationStatus: "VERIFIED", gatewayStatus: "SUCCESS", reconciliationStatus: "DISPUTED", amount: 3000 };
  count = 0;
  await expectRedirect(/status changed/);
  assert.equal(audits, 0);
  count = 1;
  form.set("notes", "Matched bank statement");
  await expectRedirect(/reconciled successfully/, "success");
  assert.equal(audits, 1);
  assert.equal(lastWrite.where.orgId, "org-1");
  assert.equal(lastWrite.where.gatewayStatus, "SUCCESS");
  assert.deepEqual(lastWrite.where.verificationStatus.in, ["VERIFIED", "NOT_REQUIRED"]);
  assert.equal(lastWrite.where.reversedAt, null);
  assert.equal(lastWrite.data.reconciliationNotes, "Matched bank statement");
  assert.equal(authorized, 8);
});

test("reconciliation UI keeps disputed payments visible and only offers reconciliation for eligible rows", async () => {
  const bundle = await build({ entryPoints: [path.resolve("apps/web/src/app/(app)/dashboard/org/payments/_components/payments-reconciliation-section.tsx")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "reconciliation-ui-fixture", setup(builder) {
    builder.onResolve({ filter: /^(next\/link|@\/lib\/ledger|@\/components\/shared\/emoji-sticker|\.\.\/actions)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/link" ? 'import React from "react"; export default (props)=>React.createElement("a",props);' : args.path.endsWith("ledger") ? 'export const formatLedgerCurrency=value=>"KES "+value; export const formatLedgerDate=()=>"12 Oct 2026";' : args.path.endsWith("emoji-sticker") ? 'export const EmojiSticker=()=>null;' : 'export const reconcilePaymentAction=async()=>{}; export const disputePaymentReconciliationAction=async()=>{}; export const importBankStatementAction=async()=>{};', loader: "js", resolveDir: process.cwd() }));
  } }] });
  const module = { exports: {} as { PaymentsReconciliationSection: any } };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(require, module, module.exports);
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const rows = ["VERIFIED", "NOT_REQUIRED", "PENDING", "REJECTED", "REVERSED"].map(verificationStatus => ({ id: verificationStatus, payerName: verificationStatus, amount: 3000, method: "BANK", targetType: "RENT", gatewayStatus: "SUCCESS", verificationStatus, reconciliationStatus: "DISPUTED", createdAt: new Date() }));
  const html = renderToStaticMarkup(React.createElement(module.exports.PaymentsReconciliationSection, { ledger: { period: "2026-10" }, periodParams: new URLSearchParams(), unreconciledCount: 2, disputedCount: 5, reconciledThisMonth: 0, pendingPayments: [], reconciliationQueue: rows }));
  assert.equal((html.match(/Mark reconciled/g) ?? []).length, 2);
  assert.equal((html.match(/Flag issue/g) ?? []).length, 5);
  assert.match(html, /Verify this payment before/);
  assert.match(html, /Rejected payments cannot/);
  assert.match(html, /Reversed payments cannot/);
});
