import { PlatformRole } from "@prisma/client";
import { KeyRound, Save, User2 } from "lucide-react";
import {
  resetPlatformUserPassword,
  updatePlatformUserProfile,
} from "../actions";
import { ControlField } from "./user-detail-ui";
import type { UserDetailWorkspaceProps } from "./user-detail-sidebar";

export function UserDetailEditUserPanel({
  details,
}: {
  details: UserDetailWorkspaceProps["details"];
}) {
  const { user } = details;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <User2 className="h-5 w-5 text-neutral-700" />
        <h3 className="text-lg font-semibold text-neutral-950">
          Edit User
        </h3>
      </div>

      <form action={updatePlatformUserProfile} className="space-y-3">
        <input type="hidden" name="userId" value={user.id} />
        <ControlField label="Full name">
          <input
            name="fullName"
            defaultValue={user.fullName}
            required
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          />
        </ControlField>
        <ControlField label="Username">
          <input
            name="username"
            defaultValue={user.username ?? ""}
            required
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          />
        </ControlField>
        <ControlField label="Email">
          <input
            name="email"
            type="email"
            defaultValue={user.email ?? ""}
            required
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          />
        </ControlField>
        <ControlField label="Phone">
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          />
        </ControlField>
        <ControlField label="System role">
          <select
            name="platformRole"
            defaultValue={user.platformRole}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          >
            {Object.values(PlatformRole).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </ControlField>
        <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <input
            type="checkbox"
            name="canCreatePlatformAdmins"
            defaultChecked={user.canCreatePlatformAdmins}
            className="mt-1 h-4 w-4 rounded border-neutral-300"
          />
          <span className="text-sm font-medium text-neutral-800">
            Can create platform admins
          </span>
        </label>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90">
          <Save className="h-4 w-4" />
          Save user
        </button>
      </form>
    </div>
  );
}

export function UserDetailPasswordPanel({
  details,
}: {
  details: UserDetailWorkspaceProps["details"];
}) {
  const { user } = details;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-neutral-700" />
        <h3 className="text-lg font-semibold text-neutral-950">
          Reset Password
        </h3>
      </div>
      <form action={resetPlatformUserPassword} className="space-y-3">
        <input type="hidden" name="userId" value={user.id} />
        <input
          name="password"
          type="password"
          minLength={8}
          placeholder="Temporary password"
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          required
        />
        <input
          name="confirmPassword"
          type="password"
          minLength={8}
          placeholder="Confirm temporary password"
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          required
        />
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50">
          <KeyRound className="h-4 w-4" />
          Set temporary password
        </button>
      </form>
    </div>
  );
}