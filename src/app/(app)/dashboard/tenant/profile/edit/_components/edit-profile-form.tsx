"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import {
  updateTenantProfileAction,
  type ProfileActionState,
} from "../../actions";

const inputClassName =
  "h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20";

const initialState: ProfileActionState = { ok: false };

type EditProfileFormProps = {
  tenant: {
    phone: string;
    email: string | null;
    nextOfKin: {
      name: string;
      relationship: string;
      phone: string;
      email: string | null;
    } | null;
  };
};

export function EditProfileForm({ tenant }: EditProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateTenantProfileAction,
    initialState,
  );

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state.ok && state.message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {state.message}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Contact details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These details are used for receipts, notices, and account recovery.
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">
            Phone
          </span>
          <input
            name="phone"
            type="text"
            required
            defaultValue={tenant.phone}
            className={inputClassName}
            disabled={pending}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">
            Email
          </span>
          <input
            name="email"
            type="email"
            defaultValue={tenant.email ?? ""}
            className={inputClassName}
            disabled={pending}
          />
        </label>
      </section>

      <section className="space-y-4 border-t border-border pt-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Next of kin
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Emergency contact kept on your tenant record.
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">
            Full name
          </span>
          <input
            name="nextOfKinName"
            type="text"
            required
            defaultValue={tenant.nextOfKin?.name ?? ""}
            className={inputClassName}
            disabled={pending}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">
            Relationship
          </span>
          <input
            name="nextOfKinRelationship"
            type="text"
            required
            defaultValue={tenant.nextOfKin?.relationship ?? ""}
            className={inputClassName}
            disabled={pending}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Phone
            </span>
            <input
              name="nextOfKinPhone"
              type="text"
              required
              defaultValue={tenant.nextOfKin?.phone ?? ""}
              className={inputClassName}
              disabled={pending}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Email
            </span>
            <input
              name="nextOfKinEmail"
              type="email"
              defaultValue={tenant.nextOfKin?.email ?? ""}
              className={inputClassName}
              disabled={pending}
            />
          </label>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/tenant/profile"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted/30"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
      </form>
    </SurfaceCard>
  );
}