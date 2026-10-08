import { ProfilePicturePanel } from "@/components/uploads/profile-picture-panel";
import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { ProfileWorkspace } from "./_components/profile-workspace";
import { getCaretakerProfileData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function CaretakerStaffProfilePage() {
  const session = await requireUserSession();

  if (
    !session.activeOrgId ||
    session.activeOrgRole !== "CARETAKER" ||
    session.platformRole === "PLATFORM_ADMIN" ||
    session.platformRole === "SUPER_ADMIN"
  ) {
    redirect("/dashboard/caretaker");
  }

  const data = await getCaretakerProfileData({
    orgId: session.activeOrgId,
    userId: session.userId,
  });

  if (data.ok && !data.member) {
    redirect("/dashboard/caretaker");
  }

  return <><div className="mx-auto max-w-7xl p-4"><ProfilePicturePanel /></div><ProfileWorkspace data={data} /></>;
}