import type { ReactNode } from "react";
import { requireUserSession } from "@/lib/auth/session";
import { WorkspaceLiveUpdates } from "@/components/realtime/workspace-live-updates";

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  const session = await requireUserSession();
  return <>{children}<WorkspaceLiveUpdates key={`${session.userId}:${session.activeOrgId}`} /></>;
}
