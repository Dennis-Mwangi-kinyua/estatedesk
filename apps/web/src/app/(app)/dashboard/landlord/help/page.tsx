import { InAppGuideHub } from "@/components/help/in-app-guide-hub";
import { requireUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LandlordHelpPage() {
  const session = await requireUserSession();

  if (session.activeOrgRole !== "LANDLORD") {
    redirect("/access-denied");
  }

  return (
    <InAppGuideHub workspace="landlord" orgRole={session.activeOrgRole} />
  );
}