import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { LandlordDashboard } from "@/app/(app)/dashboard/landlord/_components/landlord-dashboard";
import { NoProfileState } from "@/app/(app)/dashboard/landlord/_components/no-profile-state";
import { getLandlordDashboardData } from "@/app/(app)/dashboard/landlord/_lib/queries";

export const dynamic = "force-dynamic";

export default async function LandlordDashboardPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/login");
  }

  if (session.activeOrgRole !== "LANDLORD") {
    redirect("/dashboard");
  }

  const data = await getLandlordDashboardData(
    session.activeOrgId,
    session.userId,
  );

  if (!data) {
    return <NoProfileState />;
  }

  return <LandlordDashboard data={data} />;
}