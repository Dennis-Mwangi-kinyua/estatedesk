import { CalendarDays, CircleUserRound, LogIn, Wallet } from "lucide-react";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { formatDate, formatMoney } from "../_lib/helpers";
import type { CaretakerProfileMember } from "../_lib/types";

export function ProfileStats({
  member,
}: {
  member: CaretakerProfileMember;
}) {
  const profile = member.staffProfile;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Status"
        value={member.user.status}
        note="Current employment account status"
        icon={CircleUserRound}
        highlight={member.user.status === "ACTIVE" ? "success" : "default"}
      />
      <StatCard
        label="Started"
        value={formatDate(member.employmentStartedAt)}
        note="Employment start date on record"
        icon={CalendarDays}
      />
      <StatCard
        label="Last login"
        value={formatDate(member.user.lastLoginAt)}
        note="Most recent sign-in to EstateDesk"
        icon={LogIn}
      />
      <StatCard
        label="Salary"
        value={formatMoney(profile?.salaryAmount, profile?.salaryCurrency ?? "KES")}
        note={profile?.jobTitle ?? "Job title not captured"}
        icon={Wallet}
      />
    </section>
  );
}