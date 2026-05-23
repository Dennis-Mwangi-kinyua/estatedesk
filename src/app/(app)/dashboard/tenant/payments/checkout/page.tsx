"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import type { PaymentInstructions } from "@/lib/payments/instructions";
import {
  type TenantPaymentCheckoutSummary,
  getTenantPaymentCheckoutSummary,
  getTenantPaymentInstructions,
  startTenantPayment,
} from "./actions";

const METHOD_LABELS: Record<string, string> = {
  mpesa: "M-Pesa",
  "airtel-money": "Airtel Money",
  kcb: "KCB Bank Kenya",
  equity: "Equity Bank",
  coop: "Co-operative Bank",
  absa: "Absa Bank Kenya",
  stanbic: "Stanbic Bank Kenya",
  ncba: "NCBA Bank",
  family: "Family Bank",
  "i-and-m": "I&M Bank",
  dtb: "Diamond Trust Bank",
  "standard-chartered": "Standard Chartered Kenya",
  prime: "Prime Bank",
  sidian: "Sidian Bank",
  kingdom: "Kingdom Bank",
  "gulf-african": "Gulf African Bank",
  ecobank: "Ecobank Kenya",
  "credit-bank": "Credit Bank",
  uba: "United Bank for Africa",
  spire: "Spire Bank",
};

function formatSource(source: string | null) {
  if (!source) return "Tenant Bill";
  if (source === "water_bill") return "Water Bill";
  if (source === "rent_charge") return "Rent / Charge";
  if (source === "advance_rent") return "Advance Rent";
  return source.replaceAll("_", " ");
}

export default function TenantPaymentCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const source = searchParams.get("source");
  const id = searchParams.get("id");
  const method = searchParams.get("method");
  const amountParam = searchParams.get("amount");
  const monthsParam = searchParams.get("months");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");
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
          amount: source === "advance_rent" ? Number(amount) : undefined,
          months: source === "advance_rent" ? Number.parseInt(months, 10) : undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start payment.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <CreditCard className="h-4 w-4" />
                Checkout
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Complete your payment
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Confirm your payment details and continue.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Method
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {methodLabel}
                </p>
              </div>

              {source === "advance_rent" && (
                <div className="grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-emerald-900">
                      Amount
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 w-full rounded-lg border border-emerald-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-600"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-emerald-900">
                      Months to cover
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      step="1"
                      value={months}
                      onChange={(e) => setMonths(e.target.value)}
                      className="h-12 w-full rounded-lg border border-emerald-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-600"
                    />
                  </label>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bill Type
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatSource(source)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Reference
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {checkoutSummary?.friendlyReference ?? "Preparing reference"}
                </p>
                {checkoutSummary ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {checkoutSummary.description} · {checkoutSummary.propertyName}{" "}
                    / Unit {checkoutSummary.unitLabel}
                  </p>
                ) : null}
              </div>

              {isMobileMoney && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-slate-700" />
                    <h2 className="text-sm font-semibold text-slate-900">
                      Mobile Money Details
                    </h2>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Phone Number
                    </span>
                    <input
                      type="tel"
                      placeholder="e.g. 254712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500"
                    />
                  </label>

                  {method === "mpesa" && paymentInstructions?.mpesaEnabled ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p className="font-semibold">M-Pesa details</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {paymentInstructions.mpesaBusinessName ? (
                          <p>
                            Business:{" "}
                            <span className="font-semibold">
                              {paymentInstructions.mpesaBusinessName}
                            </span>
                          </p>
                        ) : null}
                        {paymentInstructions.mpesaPaybill ? (
                          <p>
                            Paybill:{" "}
                            <span className="font-semibold">
                              {paymentInstructions.mpesaPaybill}
                            </span>
                          </p>
                        ) : null}
                        {paymentInstructions.mpesaTillNumber ? (
                          <p>
                            Till:{" "}
                            <span className="font-semibold">
                              {paymentInstructions.mpesaTillNumber}
                            </span>
                          </p>
                        ) : null}
                        {paymentInstructions.mpesaAccountNumber ? (
                          <p>
                            Account:{" "}
                            <span className="font-semibold">
                              {paymentInstructions.mpesaAccountNumber}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      {paymentInstructions.mpesaInstructions ? (
                        <p className="mt-3 leading-6">
                          {paymentInstructions.mpesaInstructions}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              {isBank && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-slate-700" />
                    <h2 className="text-sm font-semibold text-slate-900">
                      Bank Payment Details
                    </h2>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Account Name
                    </span>
                    <input
                      type="text"
                      placeholder="Enter account holder name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500"
                    />
                  </label>

                  {paymentInstructions?.bankEnabled ? (
                    <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                      <p className="font-semibold">Bank details</p>
                      <div className="mt-3 grid gap-2">
                        <p>
                          Bank:{" "}
                          <span className="font-semibold">
                            {paymentInstructions.bankName}
                          </span>
                        </p>
                        <p>
                          Account name:{" "}
                          <span className="font-semibold">
                            {paymentInstructions.bankAccountName}
                          </span>
                        </p>
                        <p>
                          Account number:{" "}
                          <span className="font-semibold">
                            {paymentInstructions.bankAccountNumber}
                          </span>
                        </p>
                        {paymentInstructions.bankBranch ? (
                          <p>
                            Branch:{" "}
                            <span className="font-semibold">
                              {paymentInstructions.bankBranch}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      {paymentInstructions.bankInstructions ? (
                        <p className="mt-3 leading-6">
                          {paymentInstructions.bankInstructions}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              {instructionsError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {instructionsError}
                </div>
              ) : null}

              {mpesaUnavailable || bankUnavailable ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  This payment method is not configured for your organization
                  yet. Please contact your property manager.
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  !source ||
                  !id ||
                  !method ||
                  isPending ||
                  mpesaUnavailable ||
                  bankUnavailable
                }
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Processing..." : "Continue to payment"}
              </button>
            </div>
          </section>

          <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Secure Payment
              </h2>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">Selected Method</p>
                <p className="mt-1">{methodLabel}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">Bill Source</p>
                <p className="mt-1">{formatSource(source)}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">How it works</p>
                {method === "mpesa" && paymentInstructions?.mpesaEnabled ? (
                  <p className="mt-1">
                    Pay using this organization&apos;s M-Pesa details, then
                    continue so EstateDesk can record the payment for review.
                  </p>
                ) : isBank && paymentInstructions?.bankEnabled ? (
                  <p className="mt-1">
                    Transfer to this organization&apos;s bank account and enter
                    the account name or reference used for the payment.
                  </p>
                ) : (
                  <p className="mt-1">
                    After confirmation, the system starts the selected payment
                    flow for this organization.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
