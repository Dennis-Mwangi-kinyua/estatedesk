import assert from "node:assert/strict";
import { test } from "node:test";
import type { Prisma } from "@prisma/client";
import { requireArrearsApproval } from "../../apps/web/src/lib/move-outs/arrears-approval";
import { settlementApprovalKey } from "../../apps/web/src/lib/move-outs/arrears-approval-key";
import { calculateSettlement } from "../../apps/web/src/lib/move-outs/settlement";
const date = "2026-10-12";
const settlement = calculateSettlement(800000, 1100000, [{ description: "Repair", amount: 500 }]);
function db(action?: string, key?: string) {
  return { auditLog: { findFirst: async (query: { where: { orgId: string; entityId: string } }) => {
    assert.equal(query.where.orgId, "org");
    assert.equal(query.where.entityId, "notice");
    return action ? { id: "event", action, metadata: { key } } : null;
  } } } as unknown as Pick<Prisma.TransactionClient, "auditLog">;
}
test("handover with arrears blocks missing, pending, rejected, and stale approval", async () => {
  const key = settlementApprovalKey(settlement, date);
  for (const state of [db(), db("MOVE_OUT_ARREARS_REQUESTED", key), db("MOVE_OUT_ARREARS_REJECTED", key), db("MOVE_OUT_ARREARS_APPROVED", "stale")]) {
    await assert.rejects(requireArrearsApproval(state, "org", "notice", settlement, date), /must approve/);
  }
  await requireArrearsApproval(db("MOVE_OUT_ARREARS_APPROVED", key), "org", "notice", settlement, date);
  assert.equal(settlement.amountOwed, 3500);
});
test("approval becomes invalid when settlement details or handover date change", async () => {
  const approved = db("MOVE_OUT_ARREARS_APPROVED", settlementApprovalKey(settlement, date));
  for (const changed of [calculateSettlement(700000, 1100000, settlement.itemisedCosts), calculateSettlement(800000, 1100001, settlement.itemisedCosts), calculateSettlement(800000, 1100000, [{ description: "Different repair", amount: 500 }])]) {
    await assert.rejects(requireArrearsApproval(approved, "org", "notice", changed, date), /must approve/);
  }
  await assert.rejects(requireArrearsApproval(approved, "org", "notice", settlement, "2026-10-11"), /must approve/);
});
test("debt-free handover does not require an arrears approval", async () => {
  const state = { auditLog: { findFirst: async () => { throw new Error("Should not request approval"); } } } as unknown as Pick<Prisma.TransactionClient, "auditLog">;
  await requireArrearsApproval(state, "org", "notice", calculateSettlement(1200000, 1100000, []), date);
});
