import { ReactNode } from "react";
import { requireAuthenticated } from "@/lib/permissions/guards";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthenticated();

  return <div className="app-mobile-canvas min-h-screen">{children}</div>;
}
