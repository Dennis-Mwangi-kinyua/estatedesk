"use client";

import { useState } from "react";
import type { AdminRecord } from "../_lib/types";
import { AdminsCard } from "./admins-ui";

export function AdminsListSection({ admins }: { admins: AdminRecord[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const activeAdminCount = admins.filter((admin) => admin.status === "ACTIVE").length;
  const search = query.trim().toLowerCase();
  const filtered = admins.filter((admin) =>
    (status === "ALL" || admin.status === status) &&
    [admin.fullName, admin.username, admin.email, admin.phone, admin.platformRole?.replaceAll("_", " ")]
      .some((value) => value?.toLowerCase().includes(search)),
  );

  return (
    <section aria-labelledby="admin-directory" className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="admin-directory" className="text-lg font-semibold">Admin directory</h2>
          <p className="mt-1 text-sm text-muted-foreground">Find accounts and review their current access.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div>
            <label htmlFor="admin-search" className="mb-1.5 block text-xs font-medium">Search accounts</label>
            <input id="admin-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, or role…" className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm sm:w-64" />
          </div>
          <div>
            <label htmlFor="admin-status" className="mb-1.5 block text-xs font-medium">Account status</label>
            <select id="admin-status" value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm">
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>
      </div>
      <p role="status" className="text-xs text-muted-foreground">Showing {filtered.length} of {admins.length} accounts</p>
      {filtered.length === 0 && admins.length > 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <p className="font-medium">No matching admins</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another name or choose a different status.</p>
          <button type="button" onClick={() => { setQuery(""); setStatus("ALL"); }} className="mt-4 min-h-11 rounded-xl border px-4 text-sm font-medium">Clear filters</button>
        </div>
      ) : <AdminsCard admins={filtered} activeAdminCount={activeAdminCount} />}
    </section>
  );
}
