import assert from "node:assert/strict";
import test from "node:test";
import { reminderSchema, followUpSchema, reminderText } from "../../apps/web/src/features/collections/policy";
test("collection reminder approval cannot be omitted and follow-up dates must be calendar dates",()=>{
 const key="00000000-0000-4000-8000-000000000001";
 assert.equal(reminderSchema.safeParse({tenantId:"tenant",channel:"EMAIL",version:"a".repeat(64),requestKey:key}).success,false);
 assert.equal(reminderSchema.safeParse({tenantId:"tenant",channel:"EMAIL",version:"a".repeat(64),requestKey:key,approved:"yes"}).success,true);
 assert.equal(followUpSchema.safeParse({tenantId:"tenant",assigneeId:"staff",date:"2026-02-30",note:"Call tenant",requestKey:key}).success,false);
 assert.match(reminderText("Jane","1200.00","KES","10 Nov 2026"),/1,200/);
});
