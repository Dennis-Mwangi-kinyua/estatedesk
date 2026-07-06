import { PlatformPermissionType } from "@prisma/client";
import { CheckCircle2, Save, Shield, User2, XCircle } from "lucide-react";
import { updatePlatformUserPermissions } from "../actions";
import { EmptyState, SummaryRow } from "./user-detail-ui";
import type { UserDetailWorkspaceProps } from "./user-detail-sidebar";

export function UserDetailPermissionsListPanel({
  details,
}: {
  details: UserDetailWorkspaceProps["details"];
}) {
  const { user } = details;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-neutral-700" />
        <h3 className="text-lg font-semibold text-neutral-950">
          Platform Permissions
        </h3>
      </div>

      {user.platformPermissions.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-5 w-5" />}
          title="No explicit permissions"
          description="This user does not currently have explicit platform permissions."
        />
      ) : (
        <div className="space-y-3">
          {user.platformPermissions.map((permission) => (
            <div
              key={permission.id}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-neutral-950">
                    {permission.permission}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Explicit platform permission
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700">
                  {permission.granted ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Granted
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Revoked
                    </>
                  )}
                </span>
              </div>

              <div className="mt-3 text-xs text-neutral-500">
                Permission ID: {permission.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserDetailEditPermissionsPanel({
  details,
}: {
  details: UserDetailWorkspaceProps["details"];
}) {
  const { user, grantedPermissionSet } = details;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-neutral-700" />
        <h3 className="text-lg font-semibold text-neutral-950">
          Edit Permissions
        </h3>
      </div>
      <form action={updatePlatformUserPermissions} className="space-y-3">
        <input type="hidden" name="userId" value={user.id} />
        <div className="grid gap-2">
          {Object.values(PlatformPermissionType).map((permission) => (
            <label
              key={permission}
              className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
            >
              <input
                type="checkbox"
                name="permissions"
                value={permission}
                defaultChecked={grantedPermissionSet.has(permission)}
                className="mt-1 h-4 w-4 rounded border-neutral-300"
              />
              <span className="text-sm font-medium text-neutral-800">
                {permission}
              </span>
            </label>
          ))}
        </div>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90">
          <Save className="h-4 w-4" />
          Save permissions
        </button>
      </form>
    </div>
  );
}

export function UserDetailSummaryPanel({
  details,
}: {
  details: UserDetailWorkspaceProps["details"];
}) {
  const { user, grantedPermissions, revokedPermissions } = details;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <User2 className="h-5 w-5 text-neutral-700" />
        <h3 className="text-lg font-semibold text-neutral-950">
          Summary
        </h3>
      </div>

      <div className="space-y-3">
        <SummaryRow label="Full Name" value={user.fullName ?? "—"} />
        <SummaryRow label="Platform Role" value={String(user.platformRole)} />
        <SummaryRow label="Status" value={String(user.status)} />
        <SummaryRow
          label="Root Super Admin"
          value={user.isRootSuperAdmin ? "Yes" : "No"}
        />
        <SummaryRow
          label="Can Create Platform Admins"
          value={user.canCreatePlatformAdmins ? "Yes" : "No"}
        />
        <SummaryRow
          label="Membership Count"
          value={String(user.memberships.length)}
        />
        <SummaryRow
          label="Permission Count"
          value={String(user.platformPermissions.length)}
        />
        <SummaryRow
          label="Granted Permissions"
          value={String(grantedPermissions.length)}
        />
        <SummaryRow
          label="Revoked Permissions"
          value={String(revokedPermissions.length)}
        />
      </div>
    </div>
  );
}