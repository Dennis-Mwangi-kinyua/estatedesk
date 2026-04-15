"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Building2,
  Smartphone,
  Landmark,
  CreditCard,
  ChevronRight,
} from "lucide-react";

type PaymentOption = {
  id: string;
  name: string;
  type: "mobile_money" | "bank";
  description: string;
  accent: string;
  logoText: string;
};

const paymentOptions: PaymentOption[] = [
  {
    id: "mpesa",
    name: "M-Pesa",
    type: "mobile_money",
    description: "Pay instantly with Safaricom M-Pesa",
    accent: "from-green-500 to-emerald-600",
    logoText: "M",
  },
  {
    id: "airtel-money",
    name: "Airtel Money",
    type: "mobile_money",
    description: "Fast mobile money payments with Airtel Money",
    accent: "from-red-500 to-rose-600",
    logoText: "A",
  },
  {
    id: "kcb",
    name: "KCB Bank Kenya",
    type: "bank",
    description: "Kenya Commercial Bank payment option",
    accent: "from-green-700 to-green-900",
    logoText: "KCB",
  },
  {
    id: "equity",
    name: "Equity Bank",
    type: "bank",
    description: "Secure payments via Equity Bank",
    accent: "from-red-700 to-red-900",
    logoText: "EQ",
  },
  {
    id: "coop",
    name: "Co-operative Bank",
    type: "bank",
    description: "Pay using Co-operative Bank channels",
    accent: "from-blue-700 to-sky-900",
    logoText: "CO-OP",
  },
  {
    id: "absa",
    name: "Absa Bank Kenya",
    type: "bank",
    description: "Convenient card and bank transfer payments",
    accent: "from-red-500 to-orange-600",
    logoText: "ABSA",
  },
  {
    id: "stanbic",
    name: "Stanbic Bank Kenya",
    type: "bank",
    description: "Pay through Stanbic Bank services",
    accent: "from-sky-600 to-blue-800",
    logoText: "SB",
  },
  {
    id: "ncba",
    name: "NCBA Bank",
    type: "bank",
    description: "Quick payments with NCBA Bank",
    accent: "from-purple-700 to-indigo-900",
    logoText: "NCBA",
  },
  {
    id: "family",
    name: "Family Bank",
    type: "bank",
    description: "Reliable Family Bank payment option",
    accent: "from-orange-500 to-amber-700",
    logoText: "FB",
  },
  {
    id: "i-and-m",
    name: "I&M Bank",
    type: "bank",
    description: "Pay securely using I&M Bank",
    accent: "from-teal-600 to-cyan-800",
    logoText: "I&M",
  },
  {
    id: "dtb",
    name: "Diamond Trust Bank",
    type: "bank",
    description: "Easy checkout with DTB",
    accent: "from-indigo-600 to-blue-900",
    logoText: "DTB",
  },
  {
    id: "standard-chartered",
    name: "Standard Chartered Kenya",
    type: "bank",
    description: "International-standard secure bank payments",
    accent: "from-green-500 to-blue-700",
    logoText: "SC",
  },
  {
    id: "prime",
    name: "Prime Bank",
    type: "bank",
    description: "Pay through Prime Bank",
    accent: "from-cyan-600 to-sky-700",
    logoText: "PB",
  },
  {
    id: "sidian",
    name: "Sidian Bank",
    type: "bank",
    description: "Simple and secure Sidian Bank payment flow",
    accent: "from-fuchsia-600 to-purple-800",
    logoText: "SB",
  },
  {
    id: "kingdom",
    name: "Kingdom Bank",
    type: "bank",
    description: "Make your payment through Kingdom Bank",
    accent: "from-emerald-500 to-lime-700",
    logoText: "KB",
  },
  {
    id: "gulf-african",
    name: "Gulf African Bank",
    type: "bank",
    description: "Pay with Gulf African Bank",
    accent: "from-amber-600 to-orange-800",
    logoText: "GAB",
  },
  {
    id: "ecobank",
    name: "Ecobank Kenya",
    type: "bank",
    description: "Secure payment option via Ecobank",
    accent: "from-blue-500 to-indigo-700",
    logoText: "ECO",
  },
  {
    id: "credit-bank",
    name: "Credit Bank",
    type: "bank",
    description: "Card and account payment support",
    accent: "from-slate-600 to-slate-900",
    logoText: "CB",
  },
  {
    id: "uba",
    name: "United Bank for Africa",
    type: "bank",
    description: "Pay using UBA banking services",
    accent: "from-red-600 to-red-800",
    logoText: "UBA",
  },
  {
    id: "spire",
    name: "Spire Bank",
    type: "bank",
    description: "Convenient payment access through Spire Bank",
    accent: "from-yellow-500 to-orange-700",
    logoText: "SPIRE",
  },
];

function getOptionIcon(type: PaymentOption["type"]) {
  return type === "mobile_money" ? Smartphone : Landmark;
}

export default function TenantPaymentGatewayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return paymentOptions;

    return paymentOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(term) ||
        option.description.toLowerCase().includes(term) ||
        option.type.toLowerCase().includes(term)
    );
  }, [search]);

  const mobileMoney = filteredOptions.filter(
    (option) => option.type === "mobile_money"
  );
  const banks = filteredOptions.filter((option) => option.type === "bank");

  const handleSelect = (option: PaymentOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("method", option.id);

    router.push(`/dashboard/tenant/payments/checkout?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <CreditCard className="h-4 w-4" />
                Payment Gateway
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Choose a payment method
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Select your preferred bank or mobile money option to continue
                with your tenant payment.
              </p>
            </div>

            <div className="w-full max-w-xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search M-Pesa, Airtel Money, KCB, Equity, Co-op..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {mobileMoney.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-700" />
              <h2 className="text-xl font-semibold text-slate-900">
                Mobile Money
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {mobileMoney.map((option) => {
                const Icon = getOptionIcon(option.type);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="group rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-300"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${option.accent} text-lg font-bold text-white shadow-md`}
                      >
                        {option.logoText}
                      </div>

                      <div className="rounded-full bg-slate-100 p-2 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">
                      {option.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {option.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                        Mobile Money
                      </span>

                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                        Select
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-900">
              Kenya Banks
            </h2>
          </div>

          {banks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {banks.map((option) => {
                const Icon = getOptionIcon(option.type);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="group rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-300"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div
                        className={`flex h-16 min-w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${option.accent} px-3 text-sm font-bold text-white shadow-md`}
                      >
                        {option.logoText}
                      </div>

                      <div className="rounded-full bg-slate-100 p-2 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">
                      {option.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {option.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                        Bank
                      </span>

                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                        Select
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-600">
                No payment options match your search.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}