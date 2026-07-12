import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { getEtimsClientConfigForOrg } from "@/lib/tax/org-etims-config";
import { loadTaxesPageData } from "./_lib/queries";
import { TaxesWorkspace } from "./_components/taxes-workspace";

export const dynamic = "force-dynamic";

export default async function TaxesPage() {
  const session = await requireManagementAccess();
  const orgId = session.activeOrgId!;

  const [data, orgConfig, orgIntegration] = await Promise.all([
    loadTaxesPageData(),
    getEtimsClientConfigForOrg(orgId),
    prisma.kraIntegration.findUnique({
      where: { orgId },
      select: {
        environment: true,
        filingMode: true,
        status: true,
        clientId: true,
        clientSecretCiphertext: true,
        webhookSecretCiphertext: true,
        apiBaseUrl: true,
        eritsBaseUrl: true,
        controlUnitSerial: true,
        branchOfficeId: true,
        lastSyncAt: true,
        lastError: true,
      },
    }),
  ]);

  const etimsReadiness = {
    configured: orgConfig.configured,
    environment: orgConfig.environment,
    baseUrl: orgConfig.baseUrl,
    controlUnitSerial: orgConfig.controlUnitSerial,
    notes: orgConfig.configured
      ? orgConfig.source === "org"
        ? ["Using organization eTIMS credentials."]
        : ["Using platform environment credentials."]
      : [
          "Configure organization settings below or set platform KRA_ETIMS_* env vars.",
        ],
    statusLabel: orgConfig.configured
      ? `Live ${orgConfig.environment} (${orgConfig.source})`
      : "Layout-ready (credentials pending)",
  };

  return (
    <TaxesWorkspace
      data={data}
      orgRole={session.activeOrgRole}
      etimsReadiness={etimsReadiness}
      orgIntegration={orgIntegration}
    />
  );
}