import Link from "next/link";
import { requireUserSession } from "@/lib/auth/session";
import { InAppGuideHub } from "@/components/help/in-app-guide-hub";
import type { HelpWorkspace } from "@/lib/help/help-workspace";
import { privatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = { ...privatePageMetadata, title: "Help and support" };

export default async function PersonalHelpPage() {
  const session = await requireUserSession();
  const workspace: HelpWorkspace | undefined = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole) ? "platform"
    : session.activeOrgRole === "TENANT" ? "tenant"
    : session.activeOrgRole === "CARETAKER" ? "caretaker"
    : session.activeOrgRole === "LANDLORD" ? "landlord"
    : ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.activeOrgRole ?? "") ? "org" : undefined;
  if (workspace) return <InAppGuideHub workspace={workspace} orgRole={session.activeOrgRole} />;
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
    <h1 className="text-3xl font-semibold">Help and support</h1>
    <Link href="/dashboard/support" className="inline-flex min-h-11 items-center rounded-xl border px-4">Contact customer support</Link>
    <p>Start with the task you need help with. Your account permissions still apply.</p>
    <ol className="list-decimal space-y-4 pl-6">
      <li><Link className="underline" href="/dashboard/today">Open Today</Link> to review your work and messages. Gate staff should check visitor details before confirming admission. Providers can accept assignments and submit completed work for review.</li>
      <li><Link className="underline" href="/dashboard/security">Open account security</Link> for passwords and signed-in devices.</li>
      <li>If the problem continues, contact your property office for property matters or <Link className="underline" href="/contact">contact EstateDesk</Link> for an application problem. Include the page name, what you tried, and any error message. Never send passwords, verification codes or payment PINs.</li>
    </ol>
    <Link className="inline-flex min-h-11 items-center rounded-xl border px-4" href="/dashboard">Return to my workspace</Link>
  </main>;
}
