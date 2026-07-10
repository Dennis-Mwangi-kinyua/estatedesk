import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { formatMoney } from "../_lib/helpers";
import type { CaretakerProfileMember } from "../_lib/types";
import { ProfileInfoField } from "./profile-info-field";

export function ProfileDetailsSection({
  member,
}: {
  member: CaretakerProfileMember;
}) {
  const profile = member.staffProfile;

  return (
    <section className={panelShellClassName}>
      <SectionIntro eyebrow="Employment" title="Profile details" />

      <div className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileInfoField label="Full name" value={member.user.fullName} />
          <ProfileInfoField
            label="Username"
            value={member.user.username ?? "Not captured"}
          />
          <ProfileInfoField label="Role" value={member.role} />
          <ProfileInfoField
            label="Job title"
            value={profile?.jobTitle ?? "Not captured"}
          />
          <ProfileInfoField
            label="Education level"
            value={profile?.educationLevel ?? "Not captured"}
          />
          <ProfileInfoField
            label="Salary"
            value={formatMoney(
              profile?.salaryAmount,
              profile?.salaryCurrency ?? "KES",
            )}
          />
          <ProfileInfoField
            label="National / employee ID"
            value={profile?.nationalId ?? "Not captured"}
          />
          <ProfileInfoField
            label="Emergency contact"
            value={profile?.emergencyContact ?? "Not captured"}
          />
        </div>

        <div className="rounded-2xl border border-border bg-muted/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Notes
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground">
            {profile?.notes ?? "No staff profile notes have been captured."}
          </p>
        </div>
      </div>
    </section>
  );
}