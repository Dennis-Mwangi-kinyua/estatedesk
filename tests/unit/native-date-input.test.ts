import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {dateParts,datePartsValue} from "../../apps/mobile/src/date-input";
describe("native calendar controls",()=>{
 it("retains partial input without treating it as a valid submitted date",()=>{const partial={year:"2026",month:"",day:"1",hour:"",minute:""};const value=datePartsValue(partial,true);assert.ok(value.startsWith("draft-date:"));assert.deepEqual(dateParts(value,true),partial);});
 it("round-trips East Africa Time across UTC date boundaries",()=>{const parts={year:"2026",month:"11",day:"9",hour:"1",minute:"30"};assert.equal(datePartsValue(parts,true),"2026-11-08T22:30:00.000Z");assert.deepEqual(dateParts(datePartsValue(parts,true),true),{year:"2026",month:"11",day:"09",hour:"01",minute:"30"});});
 it("rejects impossible calendar days and clock values",()=>{for(const patch of [{year:"2026",month:"2",day:"29"},{month:"13"},{day:"0"},{hour:"24"},{minute:"60"}])assert.match(datePartsValue({year:"2026",month:"11",day:"9",hour:"12",minute:"30",...patch},true),/^draft-date:/);});
 it("supports leap days, optional dates and date-only forms",()=>{assert.equal(datePartsValue({year:"2028",month:"2",day:"29",hour:"",minute:""},false),"2028-02-29");assert.equal(datePartsValue(dateParts("",true),true),"");assert.deepEqual(dateParts("2026-11-09",false),{year:"2026",month:"11",day:"09",hour:"",minute:""});});
});
