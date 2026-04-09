import { ReactNode } from "react";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { CaretakerDashboardShell } from "@/components/layout/caretaker-dashboard-shell";

type CaretakerLayoutProps = {
  children: ReactNode;
};

export default async function CaretakerLayout({
  children,
}: CaretakerLayoutProps) {
  const session = await requireCaretakerAccess();

  return (
    <CaretakerDashboardShell fullName={session.fullName}>
      {children}
    </CaretakerDashboardShell>
  );
}