import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuthenticated } from "@/lib/permissions/guards";
import { privatePageMetadata } from "@/lib/seo";
import { AppActionFeedback } from "@/components/shared/app-action-feedback";

export const metadata = privatePageMetadata;

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuthenticated();
  const headerStore = await headers();
  const pathname = headerStore.get("x-estatedesk-pathname") ?? "";

  if (
    pathname !== "/change-password" &&
    (session.mustChangePassword || session.requiresTermsAcceptance)
  ) {
    redirect("/change-password");
  }

  return (
    <div className="app-mobile-canvas min-h-screen">
      {children}
      <AppActionFeedback />
    </div>
  );
}
