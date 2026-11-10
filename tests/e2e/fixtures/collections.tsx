import { createRoot } from "react-dom/client";
import { CollectionsView } from "@/features/collections/view";
import { CsvImportForm } from "@/app/(app)/dashboard/org/imports/import-form";
import type { CollectionsData } from "@/features/collections/queries";
const row={id:"tenant-fixture",tenantHref:"/dashboard/org/tenants/fixture",name:"Jane Tenant",balance:25000,oldestDue:"2026-10-01T00:00:00Z",phone:"+254700000000",email:"jane@example.test",userId:"user-fixture",owner:null,nextContactAt:null,reviews:0,broken:0,leases:[{id:"lease-fixture",label:"Greenview · A1"}],tasks:[],promises:[],notifications:[],reminder:"Hello Jane Tenant, our records show overdue rent of KES 25,000. Please review your statement.",version:"a".repeat(64)};
const data={page:1,view:"all",q:"",date:"10 Nov 2026",currency:"KES",staff:[{id:"staff-fixture",name:"Collection owner"}],total:2,accounts:2,overdue:37000,broken:0,dueToday:0,collectedToday:5000,collectedMonth:50000,keptPromises:3,unknownPayments:1,rows:[row,{...row,id:"tenant-review",name:"Payment review tenant",reviews:1}]} as CollectionsData;
createRoot(document.getElementById("fixture")!).render(<><CollectionsView data={data} canRemind canSetup canTenantRecords/><section className="mt-10" aria-label="Spreadsheet import"><CsvImportForm/></section></>);
