import { requireOrgRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { WorkspaceHero } from "@/components/shared/workspace-hero";
import { BnbForm } from "@/features/bnb/components/bnb-form";
export default async function NewBnbPage() {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: session.activeOrgId! }, select: { currencyCode: true } });
  return <main id="main-content" className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8"><WorkspaceHero kind="org" eyebrow="Airbnb" title="Post a BnB" description="Show guests your space. Add photos and details, then save a draft or publish your stay." /><BnbForm contactName={session.fullName} currency={org.currencyCode} /></main>;
}
