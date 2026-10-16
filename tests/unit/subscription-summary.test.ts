import assert from "node:assert/strict";
import { test } from "node:test";
import { subscriptionDisplayAmount } from "../../apps/web/src/lib/billing/subscription-summary";

test("billing details display free plans and distinguish unset custom amounts",()=>{
  assert.equal(subscriptionDisplayAmount("FREE",null),0);
  assert.equal(subscriptionDisplayAmount("ENTERPRISE",null),null);
  assert.equal(subscriptionDisplayAmount("PRO",null),3000);
  assert.equal(subscriptionDisplayAmount("ENTERPRISE",{amountDue:12500}),12500);
  assert.equal(subscriptionDisplayAmount("ENTERPRISE",{amountDue:-100}),null);
  assert.equal(subscriptionDisplayAmount("PRO",{amountDue:Infinity}),null);
});
