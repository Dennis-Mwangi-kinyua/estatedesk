import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { formatDate, statusClasses } from "../_lib/helpers";
import type { CaretakerProfileMember } from "../_lib/types";
import { ProfileInfoField } from "./profile-info-field";

export function ProfileAccountSection({
  member,
}: {
  member: CaretakerProfileMember;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro eyebrow="Access" title="Account" />

      <div className="space-y-3 p-5 sm:p-6">
        <ProfileInfoField
          label="Email"
          value={member.user.email ?? "Not captured"}
        />
        <ProfileInfoField
          label="Phone"
          value={member.user.phone ?? "Not captured"}
        />

        <div className="rounded-2xl border border-border bg-muted/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <span
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
              member.user.status,
            )}`}
          >
            {member.user.status}
          </span>
        </div>

        <ProfileInfoField
          label="Started"
          value={formatDate(member.employmentStartedAt)}
        />
        <ProfileInfoField
          label="Last login"
          value={formatDate(member.user.lastLoginAt)}
        />
      </div>
    </section>
  );
}