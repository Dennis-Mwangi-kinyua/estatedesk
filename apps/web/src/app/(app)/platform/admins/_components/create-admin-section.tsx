import { PlatformRole, UserStatus } from "@prisma/client";
import { createPlatformAdmin } from "../_lib/actions";
import { ALL_PLATFORM_PERMISSIONS } from "../_lib/constants";
import { Field, formatRole } from "./admins-ui";

export function CreateAdminSection() {
  return (
    <section className="rounded-2xl border bg-background shadow-sm">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Add Platform Admin
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a verified admin account with username, password, role, and
              permissions.
            </p>
          </div>

          <span className="inline-flex min-h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition group-open:bg-muted group-open:text-foreground">
            Add Admin
          </span>
        </summary>

        <div className="border-t px-4 py-4 sm:px-5">
          <form action={createPlatformAdmin} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName">
                <input
                  id="fullName"
                  name="fullName"
                  required
                  placeholder="Enter full name"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Verified username" htmlFor="username">
                <input
                  id="username"
                  name="username"
                  required
                  minLength={3}
                  maxLength={30}
                  placeholder="e.g. admin.jane"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Email" htmlFor="email">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@estatedesk.com"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Phone" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  placeholder="Optional phone number"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Password" htmlFor="password">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Confirm password" htmlFor="confirmPassword">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Repeat password"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Platform role" htmlFor="platformRole">
                <select
                  id="platformRole"
                  name="platformRole"
                  defaultValue={PlatformRole.PLATFORM_ADMIN}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                >
                  <option value={PlatformRole.PLATFORM_ADMIN}>
                    PLATFORM ADMIN
                  </option>
                  <option value={PlatformRole.SUPER_ADMIN}>SUPER ADMIN</option>
                </select>
              </Field>

              <Field label="Status" htmlFor="status">
                <select
                  id="status"
                  name="status"
                  defaultValue={UserStatus.ACTIVE}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                >
                  <option value={UserStatus.ACTIVE}>ACTIVE</option>
                  <option value={UserStatus.SUSPENDED}>SUSPENDED</option>
                  <option value={UserStatus.DISABLED}>DISABLED</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 rounded-2xl border p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="canCreatePlatformAdmins"
                  className="mt-1 h-4 w-4 rounded border"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Can create platform admins
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Allows this admin to create other platform admins.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="isRootSuperAdmin"
                  className="mt-1 h-4 w-4 rounded border"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Root super admin
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Highest-level admin. Must use the SUPER ADMIN role.
                  </p>
                </div>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Platform permissions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select the rights this admin should have.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ALL_PLATFORM_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-start gap-3 rounded-2xl border p-3"
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={permission}
                      className="mt-1 h-4 w-4 rounded border"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatRole(permission)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              The admin username and email will be marked as verified
              immediately. The password will be securely hashed before saving.
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
              >
                Create Verified Admin
              </button>
            </div>
          </form>
        </div>
      </details>
    </section>
  );
}
