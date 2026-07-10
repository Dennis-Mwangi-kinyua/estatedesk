"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Smartphone,
  Landmark,
  CreditCard,
  ChevronRight,
  Zap,
  ClipboardPaste,
} from "lucide-react";
import type { PaymentMethodDefinition } from "@/lib/payments/methods-catalog";

type PaymentGatewayProps = {
  availableMethods: PaymentMethodDefinition[];
};

function getOptionIcon(method: PaymentMethodDefinition) {
  if (method.settlement === "gateway" || method.type === "gateway") return Zap;
  if (method.type === "manual" || method.id.startsWith("manual-")) {
    return ClipboardPaste;
  }
  return method.type === "mobile_money" ? Smartphone : Landmark;
}

export function PaymentGateway({ availableMethods }: PaymentGatewayProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  const source = searchParams.get("source");
  const id = searchParams.get("id");
  const amount = searchParams.get("amount");

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return availableMethods;

    return availableMethods.filter(
      (option) =>
        option.name.toLowerCase().includes(term) ||
        option.description.toLowerCase().includes(term) ||
        option.type.toLowerCase().includes(term) ||
        option.settlement.toLowerCase().includes(term),
    );
  }, [availableMethods, search]);

  const instantMethods = filteredOptions.filter(
    (option) => option.settlement === "gateway",
  );
  const manualMethods = filteredOptions.filter(
    (option) => option.settlement === "manual",
  );

  const handleSelect = (option: PaymentMethodDefinition) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("method", option.id);
    // Preserve bill context from Pay Now
    if (source) params.set("source", source);
    if (id) params.set("id", id);
    if (amount) params.set("amount", amount);
    router.push(`/dashboard/tenant/payments/checkout?${params.toString()}`);
  };

  if (availableMethods.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
            <CreditCard className="mx-auto h-10 w-10 text-foreground/50" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              No payment methods available
            </h1>
            <p className="mt-2 text-sm leading-6 text-foreground/75">
              Your organization has not enabled any payment methods yet. Contact
              your property manager to set up M-Pesa, KCB paybill, or bank
              details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-100">
                <CreditCard className="h-4 w-4" />
                Choose how to pay
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Payment methods
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-foreground/75 sm:text-base">
                Like eCitizen: pick an{" "}
                <span className="font-semibold text-foreground">
                  instant gateway
                </span>{" "}
                (bill updates automatically) or{" "}
                <span className="font-semibold text-foreground">
                  manual M-Pesa / bank
                </span>{" "}
                (paste your confirmation — pending until your organization
                verifies).
              </p>
              {source && id ? (
                <p className="mt-3 text-xs font-medium text-foreground/65">
                  Paying: {source.replaceAll("_", " ")} · {id}
                  {amount ? ` · amount ${amount}` : ""}
                </p>
              ) : null}
            </div>

            {availableMethods.length > 4 ? (
              <div className="w-full max-w-xl">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/45" />
                  <input
                    type="text"
                    placeholder="Search methods…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-border bg-background pl-12 pr-4 text-sm text-foreground outline-none transition placeholder:text-foreground/45 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {instantMethods.length > 0 ? (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Instant payment gateways
                </h2>
                <p className="text-sm text-foreground/70">
                  Successful payments clear or partially reduce your bill
                  automatically — no org review required.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {instantMethods.map((option) => (
                <MethodCard
                  key={option.id}
                  option={option}
                  badge="Auto-clears bill"
                  badgeClass="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </section>
        ) : null}

        {manualMethods.length > 0 ? (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Manual M-Pesa / bank
                </h2>
                <p className="text-sm text-foreground/70">
                  Pay outside the app, paste your transaction code or SMS. Status
                  stays <span className="font-semibold">pending</span> until the
                  organization verifies.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {manualMethods.map((option) => (
                <MethodCard
                  key={option.id}
                  option={option}
                  badge="Pending verification"
                  badgeClass="bg-amber-500/15 text-amber-900 dark:text-amber-200"
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </section>
        ) : null}

        {filteredOptions.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
            <p className="text-foreground/75">
              No payment options match your search.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MethodCard({
  option,
  badge,
  badgeClass,
  onSelect,
}: {
  option: PaymentMethodDefinition;
  badge: string;
  badgeClass: string;
  onSelect: (option: PaymentMethodDefinition) => void;
}) {
  const Icon = getOptionIcon(option);

  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      className="group rounded-3xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${option.accent} text-lg font-bold text-white shadow-md`}
        >
          {option.logoText}
        </div>
        <div className="rounded-full bg-muted p-2 text-foreground/70 transition group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground">{option.name}</h3>
      <p className="mt-2 text-sm leading-6 text-foreground/75">
        {option.description}
      </p>
      <div className="mt-5 flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${badgeClass}`}
        >
          {badge}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Select
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
