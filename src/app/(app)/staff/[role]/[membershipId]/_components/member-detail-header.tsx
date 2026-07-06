import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { PresencePill, RolePill } from "@/app/(app)/staff/_components/staff-ui";
import { formatRelative } from "@/app/(app)/staff/_lib/helpers";
import type { MemberDetailWorkspaceProps } from "./member-detail-workspace";
import { StatTile, StatusPill } from "./member-detail-ui";

export function MemberDetailHeader({
  member,
  meta,
  normalizedRole,
  isOnline,
  lastSeenAt,
  activeAssignments,
  now,
}: MemberDetailWorkspaceProps) {
  const roleSlug = normalizedRole.toLowerCase();

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span
                aria-hidden="true"
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${meta.badgeClass} dark:border-border dark:bg-muted/20 dark:text-foreground`}
              >
                {meta.shortLabel}
              </span>
              Staff profile
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {member.user.fullName}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <RolePill role={normalizedRole} />
              <StatusPill>{member.user.status}</StatusPill>
              <PresencePill online={isOnline} />
              {member.user.emailVerified ? (
                <StatusPill variant="success">Email verified</StatusPill>
              ) : (
                <StatusPill variant="warning">Email not verified</StatusPill>
              )}
              {member.user.phone ? (
                member.user.phoneVerified ? (
                  <StatusPill variant="success">Phone verified</StatusPill>
                ) : (
                  <StatusPill variant="warning">Phone not verified</StatusPill>
                )
              ) : null}
              {member.user.twoFactorEnabled ? (
                <StatusPill variant="success">2FA enabled</StatusPill>
              ) : (
                <StatusPill variant="muted">2FA off</StatusPill>
              )}
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {meta.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href={`/staff/${roleSlug}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {meta.label.toLowerCase()} directory
            </Link>
            <Link
              href={`/staff/${roleSlug}/${member.id}/edit`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Pencil className="h-4 w-4" />
              Edit details
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        <StatTile label="Account status" value={member.user.status} />
        <StatTile
          label="Last seen"
          value={isOnline ? "Online now" : formatRelative(lastSeenAt, now)}
        />
        {normalizedRole === "CARETAKER" ? (
          <StatTile
            label="Active assignments"
            value={activeAssignments.toLocaleString()}
          />
        ) : (
          <StatTile label="Organisation scope" value={member.scopeType} />
        )}
      </div>

      <div className="border-t border-border px-5 py-4 sm:px-6">
        <p className="text-sm text-muted-foreground">
          {isOnline
            ? "Currently online in the organisation workspace."
            : `Last active ${formatRelative(lastSeenAt, now)}.`}{" "}
          Scope: <span className="font-medium text-foreground">{member.scopeType}</span>
        </p>
      </div>
    </section>
  );
}