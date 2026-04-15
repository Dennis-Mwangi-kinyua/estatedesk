"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { startTenantPayment } from "./actions";

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
  return source.replaceAll("_", " ");
}

export default function TenantPaymentCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const source = searchParams.get("source");
  const id = searchParams.get("id");
  const method = searchParams.get("method");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const methodLabel = useMemo(() => {
    if (!method) return "Not selected";
    return METHOD_LABELS[method] ?? method;
  }, [method]);

  const isMobileMoney = method === "mpesa" || method === "airtel-money";
  const isBank = Boolean(method) && !isMobileMoney;

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

    if (isBank && !accountName.trim()) {
      setError("Account name is required for bank payments.");
      return;
    }

    startTransition(async () => {
      try {
        await startTenantPayment({
          source,
          id,
          method,
          phoneNumber: isMobileMoney ? phoneNumber.trim() : undefined,
          accountName: isBank ? accountName.trim() : undefined,
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
                  Reference ID
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">
                  {id ?? "Missing bill id"}
                </p>
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
                </div>
              )}

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!source || !id || !method || isPending}
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
                <p className="mt-1">
                  After confirmation, the system starts a secure payment flow for
                  the selected method.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}