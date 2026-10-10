import {
  listAvailablePaymentMethods,
} from "@/lib/payments/instructions";
import { isMpesaStkConfigured } from "@/lib/payments/method-flow";
import { getTenantPaymentInstructions } from "../checkout/_lib/get-instructions";
import { PaymentGateway } from "./_components/payment-gateway";
import { requireTenantAccess } from "@/lib/permissions/guards";

export default async function TenantPaymentGatewayPage() {
  const session = await requireTenantAccess();
  const instructions = await getTenantPaymentInstructions();
  let availableMethods = listAvailablePaymentMethods(instructions);

  // Only show STK when Daraja env is fully configured.
  if (!isMpesaStkConfigured(session.activeOrgId)) {
    availableMethods = availableMethods.filter((m) => m.id !== "mpesa-stk");
  }

  return <PaymentGateway availableMethods={availableMethods} />;
}
