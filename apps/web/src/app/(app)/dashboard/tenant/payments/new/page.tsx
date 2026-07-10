import {
  listAvailablePaymentMethods,
} from "@/lib/payments/instructions";
import { isMpesaStkConfigured } from "@/lib/payments/method-flow";
import { getTenantPaymentInstructions } from "../checkout/_lib/get-instructions";
import { PaymentGateway } from "./_components/payment-gateway";

export default async function TenantPaymentGatewayPage() {
  const instructions = await getTenantPaymentInstructions();
  let availableMethods = listAvailablePaymentMethods(instructions);

  // Only show STK when Daraja env is fully configured.
  if (!isMpesaStkConfigured()) {
    availableMethods = availableMethods.filter((m) => m.id !== "mpesa-stk");
  }

  return <PaymentGateway availableMethods={availableMethods} />;
}
