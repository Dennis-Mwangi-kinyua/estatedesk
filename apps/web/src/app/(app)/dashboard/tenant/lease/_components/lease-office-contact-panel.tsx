import { PortalOfficeContact } from "@/components/tenant/portal-office-contact";
import type { TenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";

type LeaseOfficeContactPanelProps = {
  portalContext: Pick<
    TenantPortalContext,
    "tenant" | "paymentInstructions" | "caretakerContact"
  >;
};

export function LeaseOfficeContactPanel({
  portalContext,
}: LeaseOfficeContactPanelProps) {
  if (!portalContext.tenant) {
    return null;
  }

  return (
    <PortalOfficeContact
      org={portalContext.tenant.org}
      paymentInstructions={portalContext.paymentInstructions}
      caretakerContact={portalContext.caretakerContact}
      layout="compact"
    />
  );
}