import { Plus } from "lucide-react";
import { inviteMemberAction } from "@/features/settings/actions/settings-actions";
import { buttonPrimaryClassName, fieldClassName } from "../../_lib/helpers";
import { formatLabel, type SettingsPageData } from "../../settings-data";
import {
  EmptyState,
  MemberMobileCard,
  SectionCard,
  StatusBadge,
} from "../../settings-ui";

export function UsersAccessSection({
  data,
  activeMembers,
}: {
  data: SettingsPageData;
  activeMembers: number;
}) {
  return (
    <SectionCard
      id="users-access"
      title="Users & Access"
      description="Manage member roles, organization access, and invitations."
      action={
        <div className="text-sm text-muted-foreground">
          {activeMembers} active of {data.members.length} members
        </div>
      }
    >
      <form
        action={inviteMemberAction}
        className="mb-5 grid gap-3 rounded-2xl border border-border bg-muted/10 p-4 md:grid-cols-[minmax(0,1fr)_180px_auto]"
      >
        <input
          type="email"
          name="email"
          placeholder="member@example.com"
          required
          className={fieldClassName}
        />

        <select name="role" defaultValue="MANAGER" className={fieldClassName}>
          <option value="LANDLORD">Landlord</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="OFFICE">Office</option>
          <option value="ACCOUNTANT">Accountant</option>
          <option value="CARETAKER">Caretaker</option>
        </select>

        <button type="submit" className={`gap-2 ${buttonPrimaryClassName}`}>
          <Plus className="h-4 w-4" />
          Invite Member
        </button>
      </form>

      {data.members.length === 0 ? (
        <EmptyState
          title="No members yet"
          description="Invite your team to start assigning roles and organization access."
        />
      ) : (
        <>
          <div className="grid gap-3 lg:hidden">
            {data.members.map((member) => (
              <MemberMobileCard key={member.id} member={member} />
            ))}
          </div>

          <div className="hidden rounded-[20px] border border-slate-200 lg:block">
            <table className="w-full table-fixed text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-950">
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Workspace member
                        </p>
                      </div>
                    </td>

                    <td className="break-all px-4 py-3 text-slate-600">
                      {member.email}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge
                        label={formatLabel(member.role)}
                        variant="default"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge
                        label={formatLabel(member.status)}
                        variant={
                          member.status === "ACTIVE"
                            ? "success"
                            : member.status === "SUSPENDED"
                              ? "warning"
                              : "danger"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SectionCard>
  );
}