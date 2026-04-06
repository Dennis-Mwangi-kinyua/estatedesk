import { ReactNode } from "react";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { CaretakerDashboardShell } from "@/components/layout/caretaker-dashboard-shell";

export default async function CaretakerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireCaretakerAccess();

  return (
    <CaretakerDashboardShell fullName={session.fullName}>
      {children}
    </CaretakerDashboardShell>
  );
}