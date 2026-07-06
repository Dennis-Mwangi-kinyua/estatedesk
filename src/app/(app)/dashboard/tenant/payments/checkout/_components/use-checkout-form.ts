"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { PaymentInstructions } from "@/lib/payments/instructions";
import {
  type TenantPaymentCheckoutSummary,
  getTenantPaymentCheckoutSummary,
  getTenantPaymentInstructions,
  startTenantPayment,
} from "../actions";
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

  const isMobileMoney = method === "mpesa" || method === "airtel-money";
  const isBank = Boolean(method) && !isMobileMoney;
  const mpesaUnavailable =
    method === "mpesa" &&
    paymentInstructions !== null &&
    !paymentInstructions.mpesaEnabled;
  const bankUnavailable =
    isBank &&
    paymentInstructions !== null &&
    !paymentInstructions.bankEnabled;

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
      setError("Missing payment details.");
      return;
    }

    if (isMobileMoney && !phoneNumber.trim()) {
      setError("Phone number is required for mobile money.");
      return;
    }

    if (mpesaUnavailable) {
      setError("M-Pesa is not configured for this organization yet.");
      return;
    }

    if (bankUnavailable) {
      setError("Bank payments are not configured for this organization yet.");
      return;
    }

    if (isBank && !accountName.trim()) {
      setError("Account name is required for bank payments.");
      return;
    }

    if ((method === "mpesa" || isBank) && !transactionId.trim()) {
      setError("Transaction ID is required for manual M-Pesa and bank payments.");
      return;
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

    startTransition(async () => {
      try {
        await startTenantPayment({
          source,
          id,
          method,
          phoneNumber: isMobileMoney ? phoneNumber.trim() : undefined,
          accountName: isBank ? accountName.trim() : undefined,
          transactionId:
            method === "mpesa" || isBank ? transactionId.trim() : undefined,
          amount: source === "advance_rent" ? Number(amount) : undefined,
          months: source === "advance_rent" ? Number.parseInt(months, 10) : undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start payment.");
      }
    });
  };

  const canSubmit =
    Boolean(source && id && method) &&
    !isPending &&
    !mpesaUnavailable &&
    !bankUnavailable;

  return {
    source,
    method,
    methodLabel,
    isMobileMoney,
    isBank,
    mpesaUnavailable,
    bankUnavailable,
    phoneNumber,
    setPhoneNumber,
    accountName,
    setAccountName,
    transactionId,
    setTransactionId,
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