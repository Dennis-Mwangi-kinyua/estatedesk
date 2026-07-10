import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { CaretakerDashboard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-dashboard";
import { getCaretakerDashboardData } from "@/app/(app)/dashboard/caretaker/_lib/queries";

export default async function CaretakerDashboardPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/login");
  }

  if (session.activeOrgRole !== "CARETAKER") {
    redirect("/dashboard");
  }

  const result = await getCaretakerDashboardData({
    orgId: session.activeOrgId,
    userId: session.userId,
    membershipScope: session.membershipScope,
  });

  return <CaretakerDashboard result={result} fullName={session.fullName} />;
}