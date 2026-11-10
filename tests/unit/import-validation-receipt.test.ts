import assert from "node:assert/strict";
import test from "node:test";
import { issueImportValidation, verifyImportValidation } from "../../apps/web/src/lib/imports/validation-receipt";
const input={orgId:"org-a",actorId:"staff-a",kind:"units" as const,csv:"propertyName,houseNo,rentAmount\nGreenview,A1,1000"};
test("import preview is bound to its exact actor, organization, dataset, file and expiry",()=>{
 const token=issueImportValidation(input,"test-only-secret",1000);
 assert.equal(verifyImportValidation(token,input,"test-only-secret",1001),true);
 for(const change of [{orgId:"org-b"},{actorId:"staff-b"},{kind:"tenants" as const},{csv:input.csv+"\nGreenview,A2,1000"}])assert.equal(verifyImportValidation(token,{...input,...change},"test-only-secret",1001),false);
 assert.equal(verifyImportValidation(token,input,"wrong-secret",1001),false);
 assert.equal(verifyImportValidation(token+"x",input,"test-only-secret",1001),false);
 assert.equal(verifyImportValidation(token,input,"test-only-secret",901000),false);
});
