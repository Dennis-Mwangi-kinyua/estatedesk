import { mobilePaymentInputSchema } from "@estatedesk/contracts/mobile";
import { getTenantPaymentInstructions } from "@/app/(app)/dashboard/tenant/payments/checkout/_lib/get-instructions";
import { getTenantPaymentCheckoutSummary } from "@/app/(app)/dashboard/tenant/payments/checkout/_lib/get-summary";
import { startTenantPayment } from "@/app/(app)/dashboard/tenant/payments/checkout/_lib/start-payment";
import { listAvailablePaymentMethods, isPaymentMethodAvailable } from "@/lib/payments/instructions";
import { validateCheckoutTransactionId } from "@/lib/payments/method-flow";
import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody, actionResult } from "@/lib/mobile/route";

export async function GET(request: Request) {
  return nativeRoute(request, async () => {
    const instructions = await getTenantPaymentInstructions();
    const methods = listAvailablePaymentMethods(instructions, { includeStk: instructions.mpesaStkEnabled === true });
    return mobileJson(methods.filter(method => ["mpesa-stk", "manual-mpesa", "manual-bank"].includes(method.id)).map(method => {
      const bankDetails = Object.entries(instructions.bankAccounts).flatMap(([name, bank]) => bank.accountNumber && bank.accountName ? [name, bank.accountName, bank.accountNumber, bank.branch, bank.instructions] : []);
      const details = method.id === "manual-mpesa"
        ? [instructions.mpesaBusinessName, instructions.mpesaPaybill && `Paybill: ${instructions.mpesaPaybill}`, instructions.mpesaTillNumber && `Till: ${instructions.mpesaTillNumber}`, instructions.mpesaAccountNumber && `Account: ${instructions.mpesaAccountNumber}`, instructions.mpesaInstructions, instructions.kcbBusinessName, instructions.kcbPaybill && instructions.kcbAccountNumber && `KCB Paybill: ${instructions.kcbPaybill}; Account: ${instructions.kcbAccountNumber}`, instructions.kcbInstructions]
        : method.id === "manual-bank" ? [...bankDetails, instructions.bankName, instructions.bankAccountName, instructions.bankAccountNumber, instructions.bankInstructions] : [method.description];
      return { id: method.id, name: method.name, instructions: details.filter(Boolean).join("\n") };
    }));
  }, { role: "TENANT" });
}

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    const input = await nativeBody(request, mobilePaymentInputSchema);
    const instructions = await getTenantPaymentInstructions();
    if (!isPaymentMethodAvailable(instructions, input.method) || (input.method === "mpesa-stk" && !instructions.mpesaStkEnabled)) return mobileJson({ error: "This payment method is unavailable." }, 400);
    if (input.method !== "manual-bank" && !input.phoneNumber?.trim()) return mobileJson({ error: "Enter your M-Pesa phone number." }, 400);
    if (input.method === "manual-bank" && !input.accountName?.trim()) return mobileJson({ error: "Enter the sender or account name." }, 400);
    if (input.method !== "mpesa-stk") {
      const reference = validateCheckoutTransactionId(input.method, input.transactionId ?? "");
      if (!reference.ok) return mobileJson({ error: reference.error }, 400);
    }
    const activeLease = await prisma.lease.findFirst({ where: { orgId: session.activeOrgId!, status: "ACTIVE", deletedAt: null, tenant: { userId: session.userId, deletedAt: null } }, select: { id: true } });
    if (!activeLease) return mobileJson({ error: "An active lease is required." }, 403);
    const summary = await getTenantPaymentCheckoutSummary(input);
    if (!summary || summary.amount == null || summary.amount <= 0) return mobileJson({ error: "This bill is unavailable or already paid." }, 400);
    if (input.amount > summary.amount) return mobileJson({ error: "Enter an amount within the outstanding balance." }, 400);
    return actionResult(() => startTenantPayment(input), "/dashboard/tenant/payments");
  }, { role: "TENANT" });
}
