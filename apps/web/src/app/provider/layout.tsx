import { TodayLink } from "@/components/shared/today-link";
import type { ReactNode } from "react";
import { requireUserSession } from "@/lib/auth/session";
import { WorkspaceLiveUpdates } from "@/components/realtime/workspace-live-updates";

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  const session = await requireUserSession();
  return <><nav aria-label="Personal workspace" className="flex justify-end px-4 py-2"><TodayLink /></nav>{children}<WorkspaceLiveUpdates key={`${session.userId}:${session.activeOrgId}`} /></>;
}
