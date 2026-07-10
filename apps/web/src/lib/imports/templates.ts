import type { ImportKind } from "@/lib/imports/types";

export const IMPORT_TEMPLATES: Record<ImportKind, string> = {
  properties:
    "name,location,address,type,waterRatePerUnit,waterFixedCharge,notes\nGreenview Apartments,Kilimani Nairobi,Wood Avenue,RESIDENTIAL,150,0,Managed apartment block",
  units:
    "propertyName,buildingName,houseNo,type,status,bedrooms,bathrooms,rentAmount,depositAmount,notes\nGreenview Apartments,Block A,A1,APARTMENT,VACANT,2,1,35000,35000,Corner unit",
  tenants:
    "fullName,phone,email,nationalId,kraPin,status,unitHouseNo,propertyName,startDate,monthlyRent,deposit,dueDay,notes\nJane Wanjiku,0712345678,jane@example.com,12345678,A123456789Z,ACTIVE,A1,Greenview Apartments,2026-06-01,35000,35000,5,Imported tenant",
};
