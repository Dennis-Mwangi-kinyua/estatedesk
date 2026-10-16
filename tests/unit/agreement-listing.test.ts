import assert from "node:assert/strict";
import { test } from "node:test";
import { agreementView, agreementListHref, agreementStatusLabel, canCancelAgreement } from "../../apps/web/src/lib/service-agreements/listing";

test("agreement categories distinguish current, drafts, signed, cancelled, and archived records", () => {
  assert.deepEqual(agreementView().statuses,["ISSUED","COMPLETED"]);
  assert.equal(agreementView("unknown").key,"current");
  assert.deepEqual(agreementView("cancelled").statuses,["REVOKED"]);
  assert.deepEqual(agreementView("archived").statuses,["EXPIRED","SUPERSEDED"]);
  assert.equal(agreementStatusLabel("ISSUED",false),"Awaiting organization signature");
  assert.equal(agreementStatusLabel("ISSUED",true),"Awaiting EstateDesk signature");
});
test("agreement navigation retains filters and page without injecting query parameters", () => {
  const url = new URL(agreementListHref("cancelled",{orgId:"org&other",q:"A & B",page:3}),"https://example.test");
  assert.equal(url.searchParams.get("orgId"),"org&other");
  assert.equal(url.searchParams.get("q"),"A & B");
  assert.equal(url.searchParams.get("view"),"cancelled");
  assert.equal(url.searchParams.get("page"),"3");
});
test("only platform administrators can cancel unsigned or pending agreements", () => {
  for (const status of ["DRAFT","ISSUED","COMPLETED","REVOKED","EXPIRED","SUPERSEDED"] as const) {
    assert.equal(canCancelAgreement(true,status),status === "DRAFT" || status === "ISSUED");
    assert.equal(canCancelAgreement(false,status),false);
  }
});
