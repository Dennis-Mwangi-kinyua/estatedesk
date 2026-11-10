import assert from "node:assert/strict";
import {it} from "node:test";
import {nativeFieldReview} from "../../apps/mobile/src/form-review";
import {nativeActionFormData,nativeActionRequestSchema,type NativeActionDefinition} from "../../packages/contracts/src/native-actions";
it("native review excludes photo payloads, passwords and opaque customer identifiers",()=>{
 assert.equal(nativeFieldReview({name:"photo",label:"Photo",type:"photo"},"data:image/jpeg;base64,secret-payload"),"One new photo selected");
 assert.equal(nativeFieldReview({name:"orgId",label:"Organization",type:"organization"},"private-id"),"Organization selected");
 assert.equal(nativeFieldReview({name:"propertyIds",label:"Properties",type:"properties"},'["private-a","private-b"]'),"2 properties selected");
 assert.equal(nativeFieldReview({name:"password",label:"Password",type:"password"},"secret"),"••••••••");
});
it("native property selectors preserve repeated HTML fields and whitelist image payload fields",()=>{
 const definition:NativeActionDefinition={id:"landlord.create",title:"Create",description:"Create",submitLabel:"Create",confirmation:"Confirm",groups:[{id:"landlord",title:"Landlord",fields:[{name:"propertyIds",label:"Properties",type:"properties",organizationField:"orgId"}]}]};
 assert.deepEqual(nativeActionFormData(definition,{propertyIds:["one","two"]}).getAll("propertyIds"),["one","two"]);
 assert.throws(()=>nativeActionFormData(definition,{propertyIds:"one"}));
 const base={kind:"organization",path:"/dashboard/org/airbnb",actionId:"bnb.listing.create"};
 assert.equal(nativeActionRequestSchema.safeParse({...base,values:{listingPhoto:"a".repeat(100000)}}).success,true);
 assert.equal(nativeActionRequestSchema.safeParse({...base,values:{notes:"a".repeat(100000)}}).success,false);
});
