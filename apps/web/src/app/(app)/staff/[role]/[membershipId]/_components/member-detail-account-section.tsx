import type { MemberDetailWorkspaceProps } from "./member-detail-workspace";
import { formatDate, formatDateTime } from "../_lib/helpers";
import {
  CredentialCard,
  DetailCard,
  InfoCard,
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
  StatusPill,
} from "./member-detail-ui";

export function MemberDetailAccountSection({ member }: MemberDetailWorkspaceProps) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        title="Account and credentials"
        description="Login identity, verification status, and account timeline for this staff member."
      />

      <div className={`space-y-5 ${panelBodyClassName}`}>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Verified login credentials
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This account uses a username and secure password hash. Passwords
                are never displayed after creation.
              </p>
            </div>
            <StatusPill variant="success">Credentials active</StatusPill>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CredentialCard
              label="Username"
              value={member.user.username ?? "—"}
            />
            <CredentialCard
              label="Email verified"
              value={member.user.emailVerified ? "Yes" : "No"}
            />
            <CredentialCard
              label="Phone verified"
              value={
                member.user.phone
                  ? member.user.phoneVerified
                    ? "Yes"
                    : "No"
                  : "No phone"
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard label="Username" value={member.user.username ?? "—"} />
          <InfoCard label="Phone" value={member.user.phone ?? "—"} />
          <InfoCard label="Email" value={member.user.email ?? "No email"} />
          <InfoCard label="Scope" value={member.scopeType} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailCard label="Role" value={member.role} />
          <DetailCard label="Added on" value={formatDate(member.createdAt)} />
          <DetailCard
            label="Account created"
            value={formatDate(member.user.createdAt)}
          />
          <DetailCard
            label="Last login"
            value={formatDateTime(member.user.lastLoginAt)}
          />
          <DetailCard
            label="Email verified on"
            value={formatDateTime(member.user.emailVerified)}
          />
          <DetailCard
            label="Phone verified on"
            value={formatDateTime(member.user.phoneVerified)}
          />
          <DetailCard
            label="Two-factor authentication"
            value={member.user.twoFactorEnabled ? "Enabled" : "Disabled"}
          />
        </div>
      </div>
    </section>
  );
}