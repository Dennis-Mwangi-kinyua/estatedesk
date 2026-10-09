import React from "react";
import { createRoot } from "react-dom/client";
import TenantNoticesPage from "@/app/(app)/dashboard/tenant/notices/page";

const unit = { houseNo: "A-204", property: { name: "Greenview Gardens and Residences" }, building: { name: "East Wing" } };
const received = Array.from({length:4}, (_,index)=>({
  id:`notification-${index}`, title:index===0?"Scheduled water maintenance for Greenview Gardens and Residences":"Community update and upcoming property maintenance",
  type:"GENERAL", channel:"IN_APP", status:index===3?"QUEUED":"SENT", createdAt:new Date("2026-10-09T09:30:00Z"), readAt:index===0?null:new Date("2026-10-09T12:30:00Z"),
  message:index===0?"Water supply will be temporarily interrupted on Saturday from 9:00 am to 2:00 pm while the maintenance team services the main supply. Please store enough water for your household. Contact management if you need assistance.":"Please keep shared spaces clear while our team carries out scheduled maintenance. Thank you for helping us keep the property safe and comfortable.",
}));
const notices = [
  { id:"notice-open", status:"INSPECTION_SCHEDULED", noticeDate:new Date("2026-10-01"), moveOutDate:new Date("2026-11-01"), lease:{unit}, inspection:{id:"inspection-open",status:"SCHEDULED",scheduledAt:new Date("2026-10-28T09:00:00Z")}, closeout:null, notes:"Please arrange the inspection in the morning. I will return both sets of keys to the caretaker." },
  { id:"notice-closed", status:"CLOSED", noticeDate:new Date("2026-05-01"), moveOutDate:new Date("2026-06-01"), lease:{unit:{...unit,houseNo:"B-103"}}, inspection:{id:"inspection-closed",status:"COMPLETED",scheduledAt:new Date("2026-05-29T09:00:00Z")}, closeout:{depositHeld:25000,deductions:2500,refundDue:22500,refundStatus:"REFUNDED",refundReference:"REF-1234",notes:"Deposit refund completed.",itemisedCosts:[{description:"Final water bill",amount:2500}]}, notes:null },
];
const target = window as unknown as { __tenantNoticesData: unknown; renderNoticesScenario: (scenario:string)=>Promise<void> };
const root=createRoot(document.getElementById("fixture")!);
target.renderNoticesScenario=async scenario=>{
  target.__tenantNoticesData={leases:[{unit}],notifications:scenario==="empty"?[]:received,moveOutNotices:scenario==="empty"?[]:notices};
  root.render(<div className="estate-workspace flex min-h-screen"><aside className="hidden w-72 shrink-0 border-r border-border p-6 lg:block">Tenant portal</aside><main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">{await TenantNoticesPage({searchParams:Promise.resolve({})})}</main></div>);
};
void target.renderNoticesScenario("populated");
