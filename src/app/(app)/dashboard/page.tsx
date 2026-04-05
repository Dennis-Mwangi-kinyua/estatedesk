import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  if (
    session.platformRole === "SUPER_ADMIN" ||
    session.platformRole === "PLATFORM_ADMIN"
  ) {
    redirect("/platform");
  }

  switch (session.activeOrgRole) {
    case "TENANT":
      redirect("/dashboard/tenant");

    case "CARETAKER":
      redirect("/dashboard/caretaker");

    case "ADMIN":
    case "MANAGER":
    case "OFFICE":
    case "ACCOUNTANT":
      redirect("/dashboard/org");

    default:
      redirect("/login");
  }
}