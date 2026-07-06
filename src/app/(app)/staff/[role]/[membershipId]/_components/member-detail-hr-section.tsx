import type { MemberDetailWorkspaceProps } from "./member-detail-workspace";
import {
  DetailCard,
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "./member-detail-ui";

export function MemberDetailHrSection({ member }: MemberDetailWorkspaceProps) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        title="Staff profile details"
        description="HR details visible to management and to the employee from their own profile page."
      />

      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${panelBodyClassName}`}>
        <DetailCard
          label="Job title"
          value={member.staffProfile?.jobTitle ?? "Not captured"}
        />
        <DetailCard
          label="Education level"
          value={member.staffProfile?.educationLevel ?? "Not captured"}
        />
        <DetailCard
          label="Salary"
          value={
            member.staffProfile?.salaryAmount
              ? `${member.staffProfile.salaryCurrency} ${member.staffProfile.salaryAmount.toNumber().toLocaleString()}`
              : "Not captured"
          }
        />
        <DetailCard
          label="National / employee ID"
          value={member.staffProfile?.nationalId ?? "Not captured"}
        />
        <DetailCard
          label="Emergency contact"
          value={member.staffProfile?.emergencyContact ?? "Not captured"}
        />
        <DetailCard
          label="Profile notes"
          value={member.staffProfile?.notes ?? "Not captured"}
        />
      </div>
    </section>
  );
}