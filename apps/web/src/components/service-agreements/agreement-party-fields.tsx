"use client";
import { useId, useState } from "react";

export function AgreementPartyFields({ organizations, initialOrgId }: { organizations: { id: string; name: string }[]; initialOrgId?: string }) {
  const organizationLabelId = useId();
  const [orgId, setOrgId] = useState(initialOrgId ?? "");
  const [customer, setCustomer] = useState(organizations.find(org => org.id === initialOrgId)?.name ?? "");
  return <>
    <label className="block space-y-2 text-sm"><span id={organizationLabelId}>Organization</span><select aria-labelledby={organizationLabelId} name="orgId" required value={orgId} onChange={event => { setOrgId(event.target.value); setCustomer(organizations.find(org => org.id === event.target.value)?.name ?? ""); }} className="w-full rounded-xl border p-3"><option value="" disabled>Select organization</option>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
    <label className="block space-y-2 text-sm"><span>Customer&apos;s full legal name</span><input name="customer" required minLength={2} maxLength={240} value={customer} onChange={event => setCustomer(event.target.value)} className="w-full rounded-xl border p-3" /></label>
  </>;
}
