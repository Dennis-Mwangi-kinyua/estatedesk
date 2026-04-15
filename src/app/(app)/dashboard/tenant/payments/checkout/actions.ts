"use server";

import { redirect } from "next/navigation";

type StartPaymentInput = {
  source: string;
  id: string;
  method: string;
  phoneNumber?: string;
  accountName?: string;
};

export async function startTenantPayment(input: StartPaymentInput) {
  const { source, id, method, phoneNumber, accountName } = input;

  if (!source || !id || !method) {
    throw new Error("Missing source, id, or method");
  }

  const params = new URLSearchParams({
    source,
    id,
    method,
  });

  if (phoneNumber) {
    params.set("phoneNumber", phoneNumber);
  }

  if (accountName) {
    params.set("accountName", accountName);
  }

  /**
   * Replace this with your real payment logic later.
   *
   * Examples:
   * - call mpesa helper in src/lib/mpesa
   * - create DB payment record with prisma
   * - redirect to hosted gateway URL
   */

  redirect(`/dashboard/tenant/payments?${params.toString()}&status=initiated`);
}