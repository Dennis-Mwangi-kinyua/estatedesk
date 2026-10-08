import { notFound } from "next/navigation";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { NewOrganizationWorkspace } from "./_components/new-org-workspace";
import { createOrganizationAction, checkOrganizationAvailability } from "./actions";

export default async function NewOrganizationPage({ searchParams }: { searchParams: Promise<{ requestId?: string }> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const { requestId } = await searchParams;
  const request = requestId ? await retryTransientDatabaseOperation(() => prisma.onboardingRequest.findUnique({ where: { id: requestId }, select: { id: true, companyName: true, fullName: true, workEmail: true, phone: true, status: true } }), { label: "onboarding-creation-prefill", attempts: 2 }) : null;
  if (requestId && !request) notFound();
  if (request && request.status !== "QUALIFIED") return <div className="rounded-xl border border-border bg-card p-5"><h1 className="font-semibold">Qualify this request first</h1><p className="mt-2 text-sm text-muted-foreground">Review the applicant’s requirements and mark the request qualified before creating their organisation.</p><a className="mt-3 inline-block text-sm text-primary underline" href="/platform/onboarding">Back to onboarding</a></div>;
  const initialValues = request ? { organizationName: request.companyName, organizationEmail: request.workEmail, organizationPhone: request.phone ?? "", adminFullName: request.fullName, adminEmail: request.workEmail, adminPhone: request.phone ?? "" } : undefined;
  return <NewOrganizationWorkspace key={requestId ?? "new"} initialValues={initialValues} onboardingRequestId={requestId} createOrganizationAction={createOrganizationAction} checkAvailability={checkOrganizationAvailability} />;
}
