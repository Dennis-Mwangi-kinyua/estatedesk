import { Save, Shield, Trash2 } from "lucide-react";
import { archiveOrphanPlatformUser, updatePlatformUserStatus } from "../actions";
import type { UserDetailWorkspaceProps } from "./user-detail-sidebar";

export function UserDetailAccountPanel({
  details,
}: {
  details: UserDetailWorkspaceProps["details"];
}) {
  const { user, isOrphanUser, archiveConfirmation } = details;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-neutral-700" />
        <h3 className="text-lg font-semibold text-neutral-950">
          Account Controls
        </h3>
      </div>

      <form action={updatePlatformUserStatus} className="space-y-3">
        <input type="hidden" name="userId" value={user.id} />
        <label className="block text-sm font-medium text-neutral-800">
          Account status
        </label>
        <select
          name="status"
          defaultValue={user.status}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          disabled={user.isRootSuperAdmin}
        >
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DISABLED">Disabled</option>
        </select>
        <button
          type="submit"
          disabled={user.isRootSuperAdmin}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Update status
        </button>
      </form>

      <div className="mt-5 border-t border-neutral-200 pt-5">
        <h4 className="text-sm font-semibold text-neutral-950">
          Delete orphan user
        </h4>
        <p className="mt-1 text-sm leading-6 text-neutral-600">
          Available only for users with no organization memberships and
          no platform permissions.
        </p>
        <form action={archiveOrphanPlatformUser} className="mt-3 space-y-3">
          <input type="hidden" name="userId" value={user.id} />
          <input
            name="confirmation"
            placeholder={`Type ${archiveConfirmation}`}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400 disabled:bg-neutral-100"
            disabled={!isOrphanUser || user.isRootSuperAdmin}
          />
          <button
            type="submit"
            disabled={!isOrphanUser || user.isRootSuperAdmin}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete user
          </button>
        </form>
      </div>
    </div>
  );
}