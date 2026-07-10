"use client";

import { useActionState } from "react";
import {
  createVacantHousesApiKeyAction,
  type CreateVacantHousesApiKeyState,
} from "./actions";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

const initialState: CreateVacantHousesApiKeyState = {
  success: false,
};

export function ApiKeyCreateForm({
  organizations,
}: {
  organizations: OrganizationOption[];
}) {
  const [state, action, pending] = useActionState(
    createVacantHousesApiKeyAction,
    initialState,
  );

  return (
    <div className="space-y-4">
      <form
        action={action}
        className="grid gap-3 rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 lg:grid-cols-[1fr_1fr_180px_auto]"
      >
        <select
          name="orgId"
          required
          className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 outline-none"
        >
          <option value="">Select organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} / {org.slug}
            </option>
          ))}
        </select>

        <input
          name="name"
          required
          placeholder="Vacant homes website"
          className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
        />

        <input
          name="expiresAt"
          type="date"
          className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-800 outline-none"
        />

        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create key"}
        </button>
      </form>

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state.plainKey ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            API key created. Copy it now; it will not be shown again.
          </p>
          <code className="mt-3 block overflow-x-auto rounded-xl border border-emerald-200 bg-white px-3 py-3 text-xs text-neutral-900">
            {state.plainKey}
          </code>
        </div>
      ) : null}
    </div>
  );
}
