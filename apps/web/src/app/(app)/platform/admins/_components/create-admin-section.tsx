import { PlatformRole, UserStatus } from "@prisma/client";
import { createPlatformAdmin } from "../_lib/actions";
import { ALL_PLATFORM_PERMISSIONS } from "../_lib/constants";
import { Field, formatRole } from "./admins-ui";

const fieldClassName =
  "min-h-11 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40";

export function CreateAdminSection() {
  return (
    <section className="rounded-2xl border bg-background shadow-sm">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-col gap-3 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Add Platform Admin
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Create a verified admin account with username, password, role, and
              permissions.
            </p>
          </div>

          <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition group-open:bg-muted group-open:text-foreground sm:w-auto">
            <span className="group-open:hidden">Add Admin</span>
            <span className="hidden group-open:inline">Close form</span>
          </span>
        </summary>

        <div className="border-t px-3 py-4 sm:px-5">
          <form action={createPlatformAdmin} className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName">
                <input
                  id="fullName"
                  name="fullName"
                  required
                  placeholder="Enter full name"
                  className={fieldClassName}
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
                  className={fieldClassName}
                />
              </Field>

              <Field label="Email" htmlFor="email">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@estatedesk.com"
                  className={fieldClassName}
                />
              </Field>

              <Field label="Phone" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  placeholder="Optional phone number"
                  className={fieldClassName}
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
                  className={fieldClassName}
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
                  className={fieldClassName}
                />
              </Field>

              <Field label="Platform role" htmlFor="platformRole">
                <select
                  id="platformRole"
                  name="platformRole"
                  defaultValue={PlatformRole.PLATFORM_ADMIN}
                  className={fieldClassName}
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
                  className={fieldClassName}
                >
                  <option value={UserStatus.ACTIVE}>ACTIVE</option>
                  <option value={UserStatus.SUSPENDED}>SUSPENDED</option>
                  <option value={UserStatus.DISABLED}>DISABLED</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 rounded-2xl border p-3 sm:p-4">
              <label className="flex min-h-11 items-start gap-3">
                <input
                  type="checkbox"
                  name="canCreatePlatformAdmins"
                  className="mt-1 h-4 w-4 shrink-0 rounded border"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Can create platform admins
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Allows this admin to create other platform admins.
                  </p>
                </div>
              </label>

              <label className="flex min-h-11 items-start gap-3">
                <input
                  type="checkbox"
                  name="isRootSuperAdmin"
                  className="mt-1 h-4 w-4 shrink-0 rounded border"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Root super admin
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
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
                <p className="text-xs leading-5 text-muted-foreground">
                  Select the rights this admin should have.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-3">
                {ALL_PLATFORM_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex min-h-11 items-start gap-3 rounded-2xl border p-3"
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={permission}
                      className="mt-1 h-4 w-4 shrink-0 rounded border"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-5 text-foreground">
                        {formatRole(permission)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-800 sm:p-4">
              The admin username and email will be marked as verified
              immediately. The password will be securely hashed before saving.
            </div>

            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 sm:w-auto"
            >
              Create Verified Admin
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}
