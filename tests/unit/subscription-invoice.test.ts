import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { createSubscriptionInvoice, renewedSubscriptionPeriod, subscriptionInvoiceAmount } from "../../apps/web/src/lib/billing/subscription-invoice";

test("renewal preserves remaining paid days and starts expired subscriptions today", () => {
  const now = new Date("2026-10-12T10:00:00Z");
  const future = new Date("2026-10-20T10:00:00Z");
  assert.equal(renewedSubscriptionPeriod(future, now).currentPeriodEnd.toISOString(), "2026-11-19T10:00:00.000Z");
  assert.equal(renewedSubscriptionPeriod(new Date("2026-09-01"), now).currentPeriodEnd.toISOString(), "2026-11-11T10:00:00.000Z");
});
test("invoice uses custom pricing or plan pricing and rejects missing or invalid amounts", () => {
  assert.equal(subscriptionInvoiceAmount("PRO", null), 3000);
  assert.equal(subscriptionInvoiceAmount("PLUS", { amountDue: 0 }), 6500);
  assert.equal(subscriptionInvoiceAmount("ENTERPRISE", { amountDue: 12500 }), 12500);
  for (const amountDue of [-5, Infinity, NaN]) assert.throws(() => subscriptionInvoiceAmount("PRO", { amountDue }));
  assert.throws(() => subscriptionInvoiceAmount("ENTERPRISE", null));
});
test("subscription PDF supports long names and instructions; missing instructions block generation", async () => {
  const input = { reference: "ED-test-2026-10-20", organisation: "Organisation ".repeat(80), plan: "Pro", amount: 3000, issuedAt: new Date("2026-10-12"), renewalDate: new Date("2026-10-20"), paymentInstructions: "Test payment instructions. ".repeat(100) };
  const pdf = await PDFDocument.load(await createSubscriptionInvoice(input));
  assert.ok(pdf.getPageCount() > 1);
  assert.equal(pdf.getAuthor(), "EstateDesk");
  assert.match(pdf.getTitle() ?? "", /Subscription invoice/);
  await assert.rejects(createSubscriptionInvoice({ ...input, paymentInstructions: " " }), /payment instructions/);
});
