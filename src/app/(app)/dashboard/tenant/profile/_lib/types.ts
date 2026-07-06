import type { PaymentInstructions } from "@/lib/payments/instructions";
import type { TenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";
import type { getTenantProfileData } from "./queries";

export type TenantProfileRecord = NonNullable<
  Awaited<ReturnType<typeof getTenantProfileData>>["tenant"]
>;

export type TenantProfilePaymentHealth = Awaited<
  ReturnType<typeof getTenantProfileData>
>["paymentHealth"];

export type TenantProfilePageData = {
  tenant: TenantProfileRecord;
  paymentHealth: TenantProfilePaymentHealth;
  paymentInstructions: PaymentInstructions;
  portalContext: TenantPortalContext;
  showPasswordUpdated: boolean;
};