import { redirect } from "next/navigation";
import {
  getManagedUserSessions,
  requireUserSession,
} from "@/lib/auth/session";
import { SecuritySessionsContent } from "@/features/security/_components/security-sessions-content";

export const dynamic = "force-dynamic";

const ORG_SECURITY_ROLES = ["MANAGER", "OFFICE", "ACCOUNTANT"] as const;

export default async function DashboardSecurityPage() {
  const session = await requireUserSession();

  if (session.activeOrgRole === "CARETAKER") {
    redirect("/dashboard/caretaker/security");
  }

  if (
    session.activeOrgRole &&
    ORG_SECURITY_ROLES.includes(
      session.activeOrgRole as (typeof ORG_SECURITY_ROLES)[number],
    )
  ) {
    redirect("/dashboard/org/security");
  }

  const sessions = await getManagedUserSessions(session.userId);
  const otherSessionCount = sessions.filter((item) => !item.isCurrent).length;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <SecuritySessionsContent
        fullName={session.fullName}
        sessions={sessions}
        otherSessionCount={otherSessionCount}
      />
    </main>
  );
}