import React from "react";
import {createRoot} from "react-dom/client";
import {OrgDetailWorkspace, type OrgDetailWorkspaceProps} from "@/app/(app)/platform/organizations/[slug]/_components/org-detail-workspace";
const data = {
  org: {id:"org-tsa",name:"TSA Properties",slug:"tsa",status:"ACTIVE",timezone:"Africa/Nairobi",currencyCode:"KES",dataRetentionDays:365,email:"office@example.test",phone:"+254700000000",createdAt:new Date("2026-01-01"),subscription:null,kraIntegration:null,_count:{tenants:24,leases:20,properties:3,payments:12,memberships:5,apiKeys:0,issues:2,notifications:5,assets:10,waterBills:12,invitations:2,auditLogs:20}},
  featureKeys:["water_billing"],paidTotal:240000,unitCount:30,recentMessages:[],recentPayments:[],recentMembers:[],recentAuditLogs:[],statusParams:{}
} as unknown as OrgDetailWorkspaceProps;
createRoot(document.getElementById("fixture")!).render(<OrgDetailWorkspace {...data} />);
