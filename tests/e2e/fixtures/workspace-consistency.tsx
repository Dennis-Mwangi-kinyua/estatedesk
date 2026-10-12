import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import WorkspaceLink, {WorkspaceAccessProvider} from "@/components/navigation/workspace-link";
import {VisualSticker} from "@/components/shared/visual-sticker";
function Fixture() {
  const [role,setRole]=useState<"ACCOUNTANT"|"ADMIN">("ACCOUNTANT");
  return <WorkspaceAccessProvider access={{platformRole:"USER",activeOrgRole:role,activeOrgId:"org"}}><main className="estate-workspace p-4">
    <button onClick={()=>setRole(role==="ADMIN"?"ACCOUNTANT":"ADMIN")} data-workspace-action="true">Switch role</button>
    <nav className="flex gap-4"><WorkspaceLink href="/dashboard/org/payments">Payments</WorkspaceLink><WorkspaceLink href="/dashboard/org/tenants">Tenants</WorkspaceLink><WorkspaceLink href="/dashboard/org/settings">Settings</WorkspaceLink><WorkspaceLink href="/platform/control">Website control</WorkspaceLink></nav>
    <div className="mt-4 flex gap-3"><button data-workspace-action="true" data-action-kind="primary">Save changes</button><button data-workspace-action="true" data-action-kind="destructive">Logout</button><button data-workspace-action="true">Cancel</button></div>
    <div className="mt-4 flex gap-3">{["Properties","Payments","Reports","Issues"].map(label=><div key={label} className="flex items-center gap-2"><VisualSticker label={label}/><span>{label}</span></div>)}</div>
    <div className="platform-recent-organizations mt-4 grid gap-3 sm:grid-cols-2">{Array.from({length:10},(_,i)=><WorkspaceLink key={i} href={`/dashboard/org/payments?q=${i}`} className="rounded-xl border border-border bg-card p-4">Organization {i+1}</WorkspaceLink>)}</div>
  </main></WorkspaceAccessProvider>;
}
createRoot(document.getElementById("fixture")!).render(<Fixture/>);
