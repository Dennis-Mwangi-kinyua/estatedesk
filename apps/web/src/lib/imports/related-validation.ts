import type { Prisma } from "@prisma/client";
import type { CsvRow } from "@/lib/csv";
import type { ImportKind } from "./types";
export async function validateRelatedImportRows(db:Pick<Prisma.TransactionClient,"property"|"unit"|"tenant">,orgId:string,kind:ImportKind,rows:CsvRow[]){
  const issues:Array<{index:number;message:string}>=[];const seen=new Set<string>();const seenUnits=new Set<string>();
  const propertyNames=[...new Set(rows.map(r=>(kind==="properties"?r.name:r.propertyName)?.trim()).filter((v):v is string=>!!v))];
  const properties=await db.property.findMany({where:{orgId,deletedAt:null,name:{in:propertyNames}},select:{id:true,name:true}});
  const units=kind==="properties"?[]:await db.unit.findMany({where:{deletedAt:null,houseNo:{in:rows.map(r=>(kind==="units"?r.houseNo:r.unitHouseNo)??"")},property:{orgId,deletedAt:null,name:{in:propertyNames}}},select:{houseNo:true,isActive:true,status:true,property:{select:{name:true}},leases:{where:{orgId,status:"ACTIVE",deletedAt:null},take:1,select:{id:true}}}});
  const tenants=kind==="tenants"?await db.tenant.findMany({where:{orgId,deletedAt:null,phone:{in:rows.map(r=>r.phone??"")}},select:{phone:true}}):[];
  rows.forEach((r,index)=>{
    const add=(message:string)=>issues.push({index,message:`Line ${index+2}: ${message}`});
    const property=(r.propertyName??"").trim();const house=(kind==="units"?r.houseNo:r.unitHouseNo)?.trim()??"";
    const key=kind==="properties"?(r.name??"").trim().toLowerCase():kind==="units"?JSON.stringify([property,house]).toLowerCase():(r.phone??"").trim();
    if(seen.has(key))add("duplicate record in this CSV.");seen.add(key);
    if(kind==="properties"&&properties.some(p=>p.name===r.name))add("a property with this name already exists.");
    if(kind==="units"){
      if(!properties.some(p=>p.name===property))add("property not found; import properties first.");
      if(units.some(u=>u.property.name===property&&u.houseNo===house))add("this unit already exists.");
      if(r.status&&r.status.trim().toUpperCase()!=="VACANT")add("import new units as VACANT; import tenants next to establish occupancy.");
    }
    if(kind==="tenants"){
      if(tenants.some(t=>t.phone===r.phone))add("a tenant with this phone already exists; review the existing tenant instead of importing again.");
      if(Boolean(property)!==Boolean(house))add("provide both propertyName and unitHouseNo to create a lease.");
      if(property&&house){const unit=units.find(u=>u.property.name===property&&u.houseNo===house);
        if(!unit)add("unit not found; import properties and units first.");
        else if(!unit.isActive||unit.status!=="VACANT"||unit.leases.length)add("this unit is not available for a new active lease.");
        const unitKey=JSON.stringify([property,house]);if(seenUnits.has(unitKey))add("another row already allocates this unit.");seenUnits.add(unitKey);
      }
    }
  });return issues;
}
