import { getManagedUserSessions, requireUserSession } from "@/lib/auth/session";
import { SecuritySessionsContent } from "@/features/security/_components/security-sessions-content";

export const dynamic = "force-dynamic";
export default async function OrgSecurityPage() {
  const session = await requireUserSession();
  const sessions = await getManagedUserSessions(session.userId);
  return <div className="org-theme-content mx-auto w-full max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:px-8"><SecuritySessionsContent fullName={session.fullName} sessions={sessions} otherSessionCount={sessions.filter(item => !item.isCurrent).length} /></div>;
}
