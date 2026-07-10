import { Clock3, Laptop, UserRound } from "lucide-react";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { SESSION_TIMEOUT_LABEL } from "@/features/security/_lib/helpers";
import type { CaretakerSecurityPageData } from "../_lib/types";

export function SecurityStats({
  data,
}: {
  data: Pick<
    CaretakerSecurityPageData,
    "fullName" | "sessions" | "otherSessionCount"
  >;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        label="Signed in as"
        value={data.fullName}
        note="Current EstateDesk account"
        icon={UserRound}
      />
      <StatCard
        label="Active sessions"
        value={data.sessions.length}
        note={
          data.otherSessionCount > 0
            ? `${data.otherSessionCount} other device${data.otherSessionCount === 1 ? "" : "s"} signed in`
            : "Only this device is signed in"
        }
        icon={Laptop}
        highlight={data.otherSessionCount > 0 ? "warning" : "success"}
      />
      <StatCard
        label="Timeout"
        value={SESSION_TIMEOUT_LABEL}
        note="Automatic sign-out after inactivity"
        icon={Clock3}
      />
    </section>
  );
}