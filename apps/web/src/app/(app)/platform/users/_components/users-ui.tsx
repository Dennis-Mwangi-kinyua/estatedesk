import { PlatformRole } from "@prisma/client";
import { Crown, KeyRound, Plus, Shield, User2 } from "lucide-react";
import { createPlatformUserAction } from "../actions";
import {
  PLATFORM_PERMISSION_VALUES,
  PLATFORM_ROLE_META,
  ROLE_VALUES,
} from "../_lib/constants";
import { formatPermission } from "../_lib/helpers";

function roleIcon(role: PlatformRole) {
  if (role === "SUPER_ADMIN") {
    return <Crown className="h-4 w-4 text-neutral-700" />;
  }

  if (role === "PLATFORM_ADMIN") {
    return <Shield className="h-4 w-4 text-neutral-700" />;
  }

  return <User2 className="h-4 w-4 text-neutral-700" />;
}

export function RoleGuidePanel() {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-950">Role guide</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Quick reference for platform access levels.
        </p>
      </div>

      <div className="divide-y divide-neutral-200">
        {ROLE_VALUES.map((roleValue) => (
          <div key={roleValue} className="flex gap-3 px-4 py-3">
            <div className="mt-0.5 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
              {roleIcon(roleValue)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                {roleValue}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-950">
                {PLATFORM_ROLE_META[roleValue].title}
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                {PLATFORM_ROLE_META[roleValue].description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CreatePlatformUserPanel() {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <details>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-950">
              Add platform user
            </h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Create users, admins, or super admins.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-neutral-950 px-3 py-2 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" />
            Add user
          </span>
        </summary>

        <form action={createPlatformUserAction} className="grid gap-5 border-t border-neutral-200 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input
                name="fullName"
                required
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="Jane Admin"
              />
            </Field>
            <Field label="Username">
              <input
                name="username"
                required
                minLength={3}
                maxLength={30}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="jane.admin"
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="jane@example.com"
              />
            </Field>
            <Field label="Phone">
              <input
                name="phone"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="+254700000000"
              />
            </Field>
            <Field label="Temporary password">
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              />
            </Field>
            <Field label="Confirm password">
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              />
            </Field>
            <Field label="System role">
              <select
                name="platformRole"
                defaultValue={PlatformRole.USER}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              >
                {ROLE_VALUES.map((role) => (
                  <option key={role} value={role}>
                    {PLATFORM_ROLE_META[role].title}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <input
                type="checkbox"
                name="canCreatePlatformAdmins"
                className="mt-1 h-4 w-4 rounded border-neutral-300"
              />
              <span>
                <span className="block text-sm font-semibold text-neutral-950">
                  Can create platform admins
                </span>
                <span className="mt-1 block text-xs leading-5 text-neutral-600">
                  Allows this account to create other control-plane admins.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-neutral-600" />
              <h3 className="text-sm font-semibold text-neutral-950">
                Platform permissions
              </h3>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {PLATFORM_PERMISSION_VALUES.map((permission) => (
                <label
                  key={permission}
                  className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-3"
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={permission}
                    className="mt-1 h-4 w-4 rounded border-neutral-300"
                  />
                  <span className="text-sm font-medium text-neutral-800">
                    {formatPermission(permission)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 md:w-fit">
            <Plus className="h-4 w-4" />
            Create platform user
          </button>
        </form>
      </details>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </span>
      {children}
    </label>
  );
}

export function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center gap-2 text-neutral-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-2 break-all text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

export function PreviewBlock({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: Array<{ id: string; title: string; detail: string }>;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-950">{title}</p>
        <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-600">
          {count}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">None</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-2">
              <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
              <p className="mt-1 truncate text-xs text-neutral-500">{item.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}