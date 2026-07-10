"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { PaymentInstructions } from "@/lib/payments/instructions";
import { isPaymentMethodAvailable } from "@/lib/payments/instructions";
import {
  isBankCheckoutMethod,
  isGatewayCheckoutMethod,
  isMobileMoneyCheckoutMethod,
  requiresAccountNameForCheckout,
  requiresPhoneForCheckout,
  requiresTransactionIdForCheckout,
  validateCheckoutTransactionId,
} from "@/lib/payments/method-flow";
import { getTenantPaymentInstructions } from "../_lib/get-instructions";
import { getTenantPaymentCheckoutSummary } from "../_lib/get-summary";
import { startTenantPayment } from "../_lib/start-payment";
import type { TenantPaymentCheckoutSummary } from "../_lib/types";
import { METHOD_LABELS } from "../_lib/constants";

export function useCheckoutForm(searchParams: {
  source: string | null;
  id: string | null;
  method: string | null;
  amountParam: string | null;
  monthsParam: string | null;
}) {
  const { source, id, method, amountParam, monthsParam } = searchParams;

  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [proofMessage, setProofMessage] = useState("");
  const [amount, setAmount] = useState(amountParam ?? "");
  const [months, setMonths] = useState(monthsParam ?? "1");
  const [error, setError] = useState("");
  const [paymentInstructions, setPaymentInstructions] =
    useState<PaymentInstructions | null>(null);
  const [checkoutSummary, setCheckoutSummary] =
    useState<TenantPaymentCheckoutSummary | null>(null);
  const [instructionsError, setInstructionsError] = useState("");
  const [isPending, startTransition] = useTransition();

  const methodLabel = useMemo(() => {
    if (!method) return "Not selected";
    return METHOD_LABELS[method] ?? method;
  }, [method]);

  const isMobileMoney = Boolean(method && isMobileMoneyCheckoutMethod(method));
  const isKcbPaybill = method === "kcb";
  const isBank = Boolean(method && isBankCheckoutMethod(method));
  const isGateway = Boolean(method && isGatewayCheckoutMethod(method));
  const methodUnavailable =
    Boolean(method) &&
    paymentInstructions !== null &&
    !isPaymentMethodAvailable(paymentInstructions, method!);

  useEffect(() => {
    let active = true;

    Promise.all([
      getTenantPaymentInstructions(),
      getTenantPaymentCheckoutSummary({ source, id }),
    ])
      .then(([instructions, summary]) => {
        if (active) {
          setPaymentInstructions(instructions);
          setCheckoutSummary(summary);
          setInstructionsError("");
          // Prefill amount for full bill; tenant may lower it for a partial payment.
          if (
            summary?.amount != null &&
            (source === "period_bill" ||
              source === "rent_charge" ||
              source === "water_bill") &&
            !amountParam
          ) {
            setAmount(String(Math.round(summary.amount)));
          }
        }
      })
      .catch(() => {
        if (active) {
          setInstructionsError("Payment instructions could not be loaded.");
        }
      });

    return () => {
      active = false;
    };
  }, [source, id]);

  const handleSubmit = () => {
    setError("");

    if (!source || !id || !method) {
      setError("Missing payment details. Go back and choose a payment method.");
      return;
    }

    if (methodUnavailable) {
      setError(
        `${methodLabel} is not configured for this organization yet. Contact your property manager.`,
      );
      return;
    }

    if (requiresPhoneForCheckout(method) && !phoneNumber.trim()) {
      setError("Phone number is required for this payment method.");
      return;
    }

    if (requiresAccountNameForCheckout(method) && !accountName.trim()) {
      setError("Sender / account name is required for bank transfers.");
      return;
    }

    if (requiresTransactionIdForCheckout(method)) {
      const validated = validateCheckoutTransactionId(method, transactionId);
      if (!validated.ok) {
        setError(validated.error);
        return;
      }
    }

    if (source === "advance_rent") {
      const parsedAmount = Number(amount);
      const parsedMonths = Number.parseInt(months, 10);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setError("Enter a valid advance rent amount.");
        return;
      }

      if (!Number.isFinite(parsedMonths) || parsedMonths < 1 || parsedMonths > 36) {
        setError("Advance rent months must be between 1 and 36.");
        return;
      }
    }

    const supportsPartialAmount =
      source === "period_bill" ||
      source === "rent_charge" ||
      source === "water_bill" ||
      source === "advance_rent";

    if (
      supportsPartialAmount &&
      source !== "advance_rent" &&
      amount.trim()
    ) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setError("Enter a valid payment amount.");
        return;
      }
      if (
        checkoutSummary?.amount != null &&
        parsedAmount > checkoutSummary.amount + 0.001
      ) {
        setError(
          `Amount cannot exceed the outstanding balance (${checkoutSummary.amount}).`,
        );
        return;
      }
    }

    startTransition(async () => {
      try {
        const parsedAmount = Number(amount);
        const amountToSend =
          supportsPartialAmount && Number.isFinite(parsedAmount) && parsedAmount > 0
            ? parsedAmount
            : source === "period_bill" ||
                source === "rent_charge" ||
                source === "water_bill"
              ? checkoutSummary?.amount ?? undefined
              : undefined;

        await startTenantPayment({
          source,
          id,
          method,
          phoneNumber: requiresPhoneForCheckout(method)
            ? phoneNumber.trim()
            : undefined,
          accountName: requiresAccountNameForCheckout(method)
            ? accountName.trim()
            : undefined,
          transactionId: requiresTransactionIdForCheckout(method)
            ? transactionId.trim()
            : undefined,
          proofMessage: proofMessage.trim() || undefined,
          amount: amountToSend,
          months:
            source === "advance_rent" ? Number.parseInt(months, 10) : undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start payment.");
      }
    });
  };

  const canSubmit =
    Boolean(source && id && method) && !isPending && !methodUnavailable;

  return {
    source,
    method,
    methodLabel,
    isMobileMoney,
    isKcbPaybill,
    isBank,
    isGateway,
    mpesaUnavailable:
      (method === "mpesa" ||
        method === "manual-mpesa" ||
        method === "mpesa-stk") &&
      methodUnavailable,
    kcbUnavailable: isKcbPaybill && methodUnavailable,
    bankUnavailable: isBank && methodUnavailable,
    methodUnavailable,
    phoneNumber,
    setPhoneNumber,
    accountName,
    setAccountName,
    transactionId,
    setTransactionId,
    proofMessage,
    setProofMessage,
    amount,
    setAmount,
    months,
    setMonths,
    error,
    paymentInstructions,
    checkoutSummary,
    instructionsError,
    isPending,
    handleSubmit,
    canSubmit,
  };
}

export type CheckoutFormState = ReturnType<typeof useCheckoutForm>;
