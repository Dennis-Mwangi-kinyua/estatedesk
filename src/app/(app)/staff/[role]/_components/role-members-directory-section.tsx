import Link from "next/link";
import { UserPlus } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import {
  ROLE_META,
  type StaffRole,
} from "@/features/staff/constants/role-meta";
import {
  panelBodyClassName,
  panelShellClassName,
  PresencePill,
  primaryButtonClassName,
  RolePill,
} from "@/app/(app)/staff/_components/staff-ui";
import type { RoleMembersDirectoryData } from "../_lib/queries";
import {
  formatDateTime,
  formatRelative,
  summarizeAssignments,
} from "../_lib/helpers";

type RoleMembersDirectorySectionProps = {
  data: RoleMembersDirectoryData;
};

function RoleMemberCard({
  href,
  name,
  email,
  phone,
  role,
  online,
  lastSeen,
  status,
  assignmentSummary,
}: {
  href: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: StaffRole;
  online: boolean;
  lastSeen: string;
  status: string;
  assignmentSummary?: string;
}) {
  return (
    <DeferredLink
      href={href}
      className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/30 hover:bg-muted/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {email ?? phone ?? "No contact"}
          </p>
        </div>
        <PresencePill online={online} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RolePill role={role} />
        <span className="inline-flex rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {status}
        </span>
      </div>

      {assignmentSummary ? (
        <div className="mt-4 rounded-2xl border border-border bg-muted/10 px-3 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Assignment
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {assignmentSummary}
          </p>
        </div>
      ) : null}

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Last seen
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{lastSeen}</p>
      </div>
    </DeferredLink>
  );
}

export function RoleMembersDirectorySection({
  data,
}: RoleMembersDirectorySectionProps) {
  const { role, rows, now } = data;
  const meta = ROLE_META[role];
  const roleSlug = role.toLowerCase();
  const isCaretaker = role === "CARETAKER";

  return (
    <section className={panelShellClassName}>
      <div className={`border-b border-border ${panelBodyClassName}`}>
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">Members</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage {meta.label.toLowerCase()} members assigned to this role.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className={panelBodyClassName}>
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/20">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              No {meta.label.toLowerCase()} members yet
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Add the first member to start managing this directory.
            </p>
            <Link
              href={`/staff/${roleSlug}/new`}
              className={`${primaryButtonClassName} mt-5 w-auto px-5`}
            >
              Add {meta.label}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-4 lg:hidden">
            {rows.map((member) => (
              <RoleMemberCard
                key={member.id}
                href={`/staff/${roleSlug}/${member.id}`}
                name={member.user.fullName}
                email={member.user.email}
                phone={member.user.phone}
                role={role}
                online={member.isOnline}
                lastSeen={formatRelative(member.lastSeenAt, now)}
                status={member.user.status}
                assignmentSummary={
                  isCaretaker
                    ? summarizeAssignments(member.assignments)
                    : undefined
                }
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/15 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold sm:px-6">Member</th>
                  {isCaretaker ? (
                    <th className="px-5 py-3 font-semibold">Assignment</th>
                  ) : null}
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
                        {member.user.email ??
                          member.user.phone ??
                          "No contact"}
                      </p>
                    </td>
                    {isCaretaker ? (
                      <td className="px-5 py-4 text-muted-foreground">
                        <p className="max-w-xs font-medium text-foreground">
                          {summarizeAssignments(member.assignments)}
                        </p>
                      </td>
                    ) : null}
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
                        href={`/staff/${roleSlug}/${member.id}`}
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
    </section>
  );
}