import Link from "next/link";
import { UserPlus } from "lucide-react";
import { formatDateTime, formatRelative } from "../_lib/helpers";
import type { getStaffDirectoryData } from "../_lib/queries";
import {
  panelBodyClassName,
  panelShellClassName,
  PresencePill,
  primaryButtonClassName,
  RolePill,
  StaffCard,
  StaffPagination,
} from "./staff-ui";

type StaffDirectorySectionProps = {
  data: Awaited<ReturnType<typeof getStaffDirectoryData>>;
};

export function StaffDirectorySection({ data }: StaffDirectorySectionProps) {
  const { rows, page, pageSize, totalStaff, now } = data;

  return (
    <section className={panelShellClassName}>
      <div className={`border-b border-border ${panelBodyClassName}`}>
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">All staff</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a staff member to manage details or caretaker assignments.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className={panelBodyClassName}>
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/20">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              No staff members found
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Add your first staff member and choose their role during setup.
            </p>
            <Link href="/staff/new" className={`${primaryButtonClassName} mt-5 w-auto px-5`}>
              Add new staff
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-4 lg:hidden">
            {rows.map((member) => (
              <StaffCard
                key={member.id}
                href={`/staff/${member.role.toLowerCase()}/${member.id}`}
                name={member.user.fullName}
                email={member.user.email}
                phone={member.user.phone}
                role={member.role}
                online={member.isOnline}
                lastSeen={formatRelative(member.lastSeenAt, now)}
                status={member.user.status}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/15 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold sm:px-6">Staff member</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Presence</th>
                  <th className="px-5 py-3 font-semibold">Last seen</th>
                  <th className="px-5 py-3 font-semibold">Account</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((member) => (
                  <tr key={member.id} className="transition hover:bg-muted/10">
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-semibold text-foreground">
                        {member.user.fullName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {member.user.email ?? member.user.phone ?? "No contact"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <RolePill role={member.role} />
                    </td>
                    <td className="px-5 py-4">
                      <PresencePill online={member.isOnline} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {formatRelative(member.lastSeenAt, now)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(member.lastSeenAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {member.user.status}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <Link
                        href={`/staff/${member.role.toLowerCase()}/${member.id}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted/20"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <StaffPagination
        page={page}
        pageSize={pageSize}
        total={totalStaff}
        basePath="/staff"
      />
    </section>
  );
}