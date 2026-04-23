"use client";

import Link from "next/link";
import {
  useActionState,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createTenantAction } from "@/features/tenants/actions/create-tenant-action";
import { UnitCombobox } from "./unit-combobox";

type AvailableUnit = {
  id: string;
  label: string;
  rentAmount: number;
  depositAmount: number | null;
};

type Step = 1 | 2 | 3 | 4;

type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  credentials?: {
    tenantName: string;
    username: string;
    password: string;
  };
};

type PreviewData = {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  kraPin: string;
  status: string;
  notes: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  nextOfKinEmail: string;
  selectedUnitLabel: string;
  leaseStartDate: string;
  dueDay: string;
  monthlyRent: string;
  deposit: string;
  usernamePreview: string;
};

const initialCreateTenantActionState: ActionState = {
  status: "idle",
};

const stepItems: Array<{
  id: Step;
  title: string;
  description: string;
}> = [
  {
    id: 1,
    title: "Tenant details",
    description: "Identity and contact info",
  },
  {
    id: 2,
    title: "Next of kin",
    description: "Emergency contact",
  },
  {
    id: 3,
    title: "Unit mapping",
    description: "Assign vacant unit",
  },
  {
    id: 4,
    title: "Preview",
    description: "Review before save",
  },
];

const inputClassName =
  "h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:cursor-not-allowed disabled:opacity-60";

function formatCurrency(value: number | null | undefined, currencyCode: string) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatStatus(value: string) {
  if (!value) return "—";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getNextStep(step: Step): Step {
  switch (step) {
    case 1:
      return 2;
    case 2:
      return 3;
    case 3:
      return 4;
    case 4:
    default:
      return 4;
  }
}

function getPreviousStep(step: Step): Step {
  switch (step) {
    case 4:
      return 3;
    case 3:
      return 2;
    case 2:
      return 1;
    case 1:
    default:
      return 1;
  }
}

function buildUsernamePreview(fullName: string) {
  const normalized = fullName
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 18);

  return normalized || "tenant";
}

function focusField(form: HTMLFormElement, fieldName: string) {
  const field = form.elements.namedItem(fieldName);
  if (field instanceof HTMLElement) {
    field.focus();
  }
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      <p className="text-sm leading-6 text-neutral-500">{description}</p>
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-2 block text-sm font-medium text-neutral-700">
      {children} {required ? <span className="text-red-500">*</span> : null}
    </span>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StepChip({
  item,
  active,
  complete,
}: {
  item: (typeof stepItems)[number];
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`w-[220px] shrink-0 rounded-[24px] border px-4 py-4 sm:w-auto ${
        active
          ? "border-neutral-900 bg-white shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
          : complete
            ? "border-green-200 bg-green-50"
            : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
            active
              ? "bg-neutral-950 text-white"
              : complete
                ? "bg-green-600 text-white"
                : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {complete ? "✓" : item.id}
        </div>

        <div>
          <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
          <p className="text-xs text-neutral-500">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

export function NewTenantForm({
  orgName,
  currencyCode,
  availableUnits,
}: {
  orgName: string;
  currencyCode: string;
  availableUnits: AvailableUnit[];
}) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const [state, formAction, isPending] = useActionState(
    createTenantAction,
    initialCreateTenantActionState,
  );

  const [step, setStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const selectedUnit = useMemo(
    () => availableUnits.find((unit) => unit.id === selectedUnitId) ?? null,
    [availableUnits, selectedUnitId],
  );

  function validateStepOne(form: HTMLFormElement) {
    const data = new FormData(form);
    const fullName = String(data.get("fullName") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();

    if (!fullName) {
      setStepError("Full name is required.");
      focusField(form, "fullName");
      return false;
    }

    if (!phone) {
      setStepError("Phone is required.");
      focusField(form, "phone");
      return false;
    }

    setStepError(null);
    return true;
  }

  function validateStepTwo(form: HTMLFormElement) {
    const data = new FormData(form);
    const nextOfKinName = String(data.get("nextOfKinName") ?? "").trim();
    const nextOfKinRelationship = String(
      data.get("nextOfKinRelationship") ?? "",
    ).trim();
    const nextOfKinPhone = String(data.get("nextOfKinPhone") ?? "").trim();

    if (!nextOfKinName) {
      setStepError("Next of kin name is required.");
      focusField(form, "nextOfKinName");
      return false;
    }

    if (!nextOfKinRelationship) {
      setStepError("Next of kin relationship is required.");
      focusField(form, "nextOfKinRelationship");
      return false;
    }

    if (!nextOfKinPhone) {
      setStepError("Next of kin phone is required.");
      focusField(form, "nextOfKinPhone");
      return false;
    }

    setStepError(null);
    return true;
  }

  function validateStepThree(form: HTMLFormElement) {
    const data = new FormData(form);
    const unitId = String(data.get("unitId") ?? "").trim();
    const dueDayRaw = String(data.get("dueDay") ?? "").trim();
    const status = String(data.get("status") ?? "").trim();

    if (!unitId) {
      setStepError(null);
      return true;
    }

    if (status !== "ACTIVE") {
      setStepError(
        "A tenant must be Active if you want to assign a unit during creation.",
      );
      focusField(form, "status");
      return false;
    }

    if (dueDayRaw) {
      const dueDay = Number.parseInt(dueDayRaw, 10);
      if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) {
        setStepError("Rent due day must be between 1 and 31.");
        focusField(form, "dueDay");
        return false;
      }
    }

    setStepError(null);
    return true;
  }

  function buildPreview(form: HTMLFormElement) {
    const data = new FormData(form);

    const fullName = String(data.get("fullName") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const nationalId = String(data.get("nationalId") ?? "").trim();
    const kraPin = String(data.get("kraPin") ?? "").trim();
    const status = String(data.get("status") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();

    const nextOfKinName = String(data.get("nextOfKinName") ?? "").trim();
    const nextOfKinRelationship = String(
      data.get("nextOfKinRelationship") ?? "",
    ).trim();
    const nextOfKinPhone = String(data.get("nextOfKinPhone") ?? "").trim();
    const nextOfKinEmail = String(data.get("nextOfKinEmail") ?? "").trim();

    const leaseStartDate = String(data.get("leaseStartDate") ?? "").trim();
    const dueDay = String(data.get("dueDay") ?? "").trim();
    const monthlyRent = String(data.get("monthlyRent") ?? "").trim();
    const deposit = String(data.get("deposit") ?? "").trim();

    setPreview({
      fullName,
      phone,
      email,
      nationalId,
      kraPin,
      status,
      notes,
      nextOfKinName,
      nextOfKinRelationship,
      nextOfKinPhone,
      nextOfKinEmail,
      selectedUnitLabel: selectedUnit ? selectedUnit.label : "No unit assignment yet",
      leaseStartDate: leaseStartDate || "Use today’s date",
      dueDay: dueDay || "5",
      monthlyRent: monthlyRent || "Use selected unit rent",
      deposit: deposit || "Use selected unit deposit",
      usernamePreview: buildUsernamePreview(fullName),
    });
  }

  function handleNext(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form || isPending) return;

    if (step === 1 && !validateStepOne(form)) return;
    if (step === 2 && !validateStepTwo(form)) return;
    if (step === 3 && !validateStepThree(form)) return;

    if (step === 3) {
      buildPreview(form);
    }

    setStep((current) => getNextStep(current));
    setTimeout(() => {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handleBack() {
    if (isPending) return;
    setStep((current) => getPreviousStep(current));
    setStepError(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  if (state.status === "success" && state.credentials) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-green-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="border-b border-green-200 bg-gradient-to-b from-green-50 to-white px-5 py-6 sm:px-7">
            <div className="inline-flex items-center rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-medium text-green-700">
              Tenant created successfully
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              Tenant account is ready
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600 sm:text-base">
              The tenant profile, next of kin details, and login account have been
              created successfully.
            </p>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-7">
            <InfoCard title="Tenant">
              <p className="text-base font-semibold text-neutral-900">
                {state.credentials.tenantName}
              </p>
            </InfoCard>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard title="Username">
                <p className="break-all font-mono text-base font-semibold text-neutral-900">
                  {state.credentials.username}
                </p>
              </InfoCard>

              <InfoCard title="Temporary password">
                <p className="break-all font-mono text-base font-semibold text-neutral-900">
                  {state.credentials.password}
                </p>
              </InfoCard>
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              Save these credentials now. The password is only shown once on this
              screen.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/dashboard/org/tenants"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Go to tenants
              </Link>

              <Link
                href="/dashboard/org/tenants/new"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Create another tenant
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-8 pt-3 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:rounded-[32px]">
        <div className="border-b border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(0,0,0,0.04),_transparent_35%),linear-gradient(to_bottom,_#fafafa,_#ffffff)] px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-700">
                Tenant setup
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                Create new tenant
              </h1>

              <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base">
                Create a tenant profile for{" "}
                <span className="font-medium text-neutral-900">{orgName}</span>.
                Add next of kin details, create a login account, and optionally map
                a vacant unit during creation.
              </p>
            </div>

            <Link
              href="/dashboard/org/tenants"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Back to tenants
            </Link>
          </div>
        </div>

        <div className="border-b border-neutral-200 bg-neutral-50/70 px-4 py-4 sm:px-6">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-3 sm:grid sm:min-w-0 sm:grid-cols-2 lg:grid-cols-4">
              {stepItems.map((item) => (
                <StepChip
                  key={item.id}
                  item={item}
                  active={step === item.id}
                  complete={step > item.id}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div
              aria-live="polite"
              aria-atomic="true"
              className="mb-5 space-y-3"
            >
              {state.status === "error" && state.message ? (
                <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.message}
                </div>
              ) : null}

              {stepError ? (
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {stepError}
                </div>
              ) : null}
            </div>

            <form
              id="new-tenant-form"
              ref={formRef}
              action={formAction}
              className="space-y-6"
            >
              <input type="hidden" name="unitId" value={selectedUnitId} />

              <section className={step === 1 ? "block" : "hidden"}>
                <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/60 p-4 sm:rounded-[28px] sm:p-5">
                  <SectionTitle
                    title="Tenant details"
                    description="Capture the tenant’s identity and contact information."
                  />

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <FieldLabel required>Full name</FieldLabel>
                      <input
                        name="fullName"
                        type="text"
                        maxLength={120}
                        placeholder="Jane Wanjiku"
                        autoComplete="name"
                        enterKeyHint="next"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel required>Phone</FieldLabel>
                      <input
                        name="phone"
                        type="text"
                        maxLength={30}
                        placeholder="0712345678"
                        autoComplete="tel"
                        inputMode="tel"
                        enterKeyHint="next"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>Email</FieldLabel>
                      <input
                        name="email"
                        type="email"
                        maxLength={120}
                        placeholder="tenant@example.com"
                        autoComplete="email"
                        enterKeyHint="next"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>National ID</FieldLabel>
                      <input
                        name="nationalId"
                        type="text"
                        maxLength={40}
                        placeholder="Optional"
                        enterKeyHint="next"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>KRA PIN</FieldLabel>
                      <input
                        name="kraPin"
                        type="text"
                        maxLength={40}
                        placeholder="Optional"
                        enterKeyHint="next"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>Status</FieldLabel>
                      <select
                        name="status"
                        defaultValue="ACTIVE"
                        className={inputClassName}
                        disabled={isPending}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="BLACKLISTED">Blacklisted</option>
                      </select>
                    </label>

                    <label className="block md:col-span-2">
                      <FieldLabel>Notes</FieldLabel>
                      <textarea
                        name="notes"
                        rows={4}
                        maxLength={1500}
                        placeholder="Internal notes about this tenant"
                        className={textareaClassName}
                        disabled={isPending}
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section className={step === 2 ? "block" : "hidden"}>
                <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/60 p-4 sm:rounded-[28px] sm:p-5">
                  <SectionTitle
                    title="Next of kin details"
                    description="Add a next of kin or emergency contact for this tenant."
                  />

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <FieldLabel required>Next of kin name</FieldLabel>
                      <input
                        name="nextOfKinName"
                        type="text"
                        maxLength={120}
                        placeholder="John Wanjala"
                        autoComplete="name"
                        enterKeyHint="next"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel required>Relationship</FieldLabel>
                      <input
                        name="nextOfKinRelationship"
                        type="text"
                        maxLength={80}
                        placeholder="Brother, Mother, Spouse..."
                        enterKeyHint="next"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel required>Phone</FieldLabel>
                      <input
                        name="nextOfKinPhone"
                        type="text"
                        maxLength={30}
                        placeholder="0700000000"
                        autoComplete="tel"
                        inputMode="tel"
                        enterKeyHint="next"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>Email</FieldLabel>
                      <input
                        name="nextOfKinEmail"
                        type="email"
                        maxLength={120}
                        placeholder="Optional"
                        autoComplete="email"
                        enterKeyHint="next"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section className={step === 3 ? "block" : "hidden"}>
                <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/60 p-4 sm:rounded-[28px] sm:p-5">
                  <SectionTitle
                    title="Unit mapping during creation"
                    description="Assign a vacant unit now, or leave it blank and map the tenant later."
                  />

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <FieldLabel>Assign unit</FieldLabel>

                      <UnitCombobox
                        units={availableUnits}
                        selectedUnitId={selectedUnitId}
                        onSelect={setSelectedUnitId}
                        currencyCode={currencyCode}
                      />
                    </label>

                    <div className="md:col-span-2 rounded-[24px] border border-neutral-200 bg-white p-4">
                      {selectedUnit ? (
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                            Selected unit
                          </p>
                          <p className="text-sm font-medium text-neutral-900">
                            {selectedUnit.label}
                          </p>
                          <div className="grid gap-2 pt-1 sm:grid-cols-2">
                            <div className="rounded-2xl bg-neutral-50 px-3 py-3 text-sm text-neutral-700">
                              <span className="block text-xs text-neutral-500">
                                Rent
                              </span>
                              <span className="mt-1 block font-medium text-neutral-900">
                                {formatCurrency(selectedUnit.rentAmount, currencyCode)}
                              </span>
                            </div>
                            <div className="rounded-2xl bg-neutral-50 px-3 py-3 text-sm text-neutral-700">
                              <span className="block text-xs text-neutral-500">
                                Deposit
                              </span>
                              <span className="mt-1 block font-medium text-neutral-900">
                                {formatCurrency(
                                  selectedUnit.depositAmount,
                                  currencyCode,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-500">
                          No unit selected yet.
                        </div>
                      )}
                    </div>

                    <label className="block">
                      <FieldLabel>Lease start date</FieldLabel>
                      <input
                        name="leaseStartDate"
                        type="date"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>Rent due day</FieldLabel>
                      <input
                        name="dueDay"
                        type="number"
                        min="1"
                        max="31"
                        defaultValue="5"
                        inputMode="numeric"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>Monthly rent override ({currencyCode})</FieldLabel>
                      <input
                        name="monthlyRent"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Leave blank to use unit rent"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>Deposit override ({currencyCode})</FieldLabel>
                      <input
                        name="deposit"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Leave blank to use unit deposit"
                        className={inputClassName}
                        disabled={isPending}
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section className={step === 4 ? "block" : "hidden"}>
                <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/60 p-4 sm:rounded-[28px] sm:p-5">
                  <SectionTitle
                    title="Preview before save"
                    description="Review the tenant profile and account details before you create it."
                  />

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <InfoCard title="Tenant profile">
                      <div className="space-y-2 text-sm text-neutral-700">
                        <p><span className="font-medium text-neutral-900">Name:</span> {preview?.fullName || "—"}</p>
                        <p><span className="font-medium text-neutral-900">Phone:</span> {preview?.phone || "—"}</p>
                        <p><span className="font-medium text-neutral-900">Email:</span> {preview?.email || "—"}</p>
                        <p><span className="font-medium text-neutral-900">National ID:</span> {preview?.nationalId || "—"}</p>
                        <p><span className="font-medium text-neutral-900">KRA PIN:</span> {preview?.kraPin || "—"}</p>
                        <p><span className="font-medium text-neutral-900">Status:</span> {preview?.status ? formatStatus(preview.status) : "—"}</p>
                        <p><span className="font-medium text-neutral-900">Notes:</span> {preview?.notes || "—"}</p>
                      </div>
                    </InfoCard>

                    <InfoCard title="Next of kin">
                      <div className="space-y-2 text-sm text-neutral-700">
                        <p><span className="font-medium text-neutral-900">Name:</span> {preview?.nextOfKinName || "—"}</p>
                        <p><span className="font-medium text-neutral-900">Relationship:</span> {preview?.nextOfKinRelationship || "—"}</p>
                        <p><span className="font-medium text-neutral-900">Phone:</span> {preview?.nextOfKinPhone || "—"}</p>
                        <p><span className="font-medium text-neutral-900">Email:</span> {preview?.nextOfKinEmail || "—"}</p>
                      </div>
                    </InfoCard>

                    <InfoCard title="Unit mapping">
                      <div className="space-y-2 text-sm text-neutral-700">
                        <p><span className="font-medium text-neutral-900">Selected unit:</span> {preview?.selectedUnitLabel || "No unit assignment yet"}</p>
                        <p><span className="font-medium text-neutral-900">Lease start:</span> {preview?.leaseStartDate || "Use today’s date"}</p>
                        <p><span className="font-medium text-neutral-900">Due day:</span> {preview?.dueDay || "5"}</p>
                        <p><span className="font-medium text-neutral-900">Rent override:</span> {preview?.monthlyRent || "Use selected unit rent"}</p>
                        <p><span className="font-medium text-neutral-900">Deposit override:</span> {preview?.deposit || "Use selected unit deposit"}</p>
                      </div>
                    </InfoCard>

                    <InfoCard title="Account details preview">
                      <div className="space-y-2 text-sm text-neutral-700">
                        <p>
                          <span className="font-medium text-neutral-900">
                            Suggested username:
                          </span>{" "}
                          {preview?.usernamePreview || "—"}
                        </p>
                        <p>
                          <span className="font-medium text-neutral-900">
                            Password:
                          </span>{" "}
                          Temporary password will be generated on save
                        </p>
                        <p className="text-xs leading-5 text-neutral-500">
                          If the suggested username is already taken, the saved
                          username may be adjusted automatically.
                        </p>
                      </div>
                    </InfoCard>
                  </div>
                </div>
              </section>

              <div className="hidden border-t border-neutral-200 pt-6 sm:block">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-neutral-500">Step {step} of 4</div>

                  <div className="flex gap-3">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={isPending}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Back
                      </button>
                    ) : (
                      <Link
                        href="/dashboard/org/tenants"
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                      >
                        Cancel
                      </Link>
                    )}

                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={isPending}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPending
                          ? "Creating tenant..."
                          : "Save tenant and create account"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 sm:hidden">
                <div className="space-y-3">
                  <div className="text-center text-sm text-neutral-500">
                    Step {step} of 4
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={isPending}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Back
                      </button>
                    ) : (
                      <Link
                        href="/dashboard/org/tenants"
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700"
                      >
                        Cancel
                      </Link>
                    )}

                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={isPending}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPending ? "Creating..." : "Save tenant"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          <aside className="hidden border-l border-neutral-200 bg-neutral-50/70 px-6 py-6 lg:block">
            <div className="sticky top-6 space-y-4">
              <InfoCard title="Preview before save">
                <ul className="space-y-2 text-sm leading-6 text-neutral-600">
                  <li>• Tenant profile preview</li>
                  <li>• Next of kin preview</li>
                  <li>• Unit assignment preview</li>
                  <li>• Account details preview</li>
                </ul>
              </InfoCard>

              <InfoCard title="After saving">
                <ul className="space-y-2 text-sm leading-6 text-neutral-600">
                  <li>• Tenant profile is created</li>
                  <li>• Next of kin is saved</li>
                  <li>• Login account is created</li>
                  <li>• Actual username and password are shown once</li>
                </ul>
              </InfoCard>

              <InfoCard title="Current selection">
                <div className="space-y-2 text-sm text-neutral-700">
                  <p>
                    <span className="font-medium text-neutral-900">Step:</span>{" "}
                    {step} of 4
                  </p>
                  <p>
                    <span className="font-medium text-neutral-900">Unit:</span>{" "}
                    {selectedUnit?.label ?? "Not selected"}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-900">Rent:</span>{" "}
                    {selectedUnit
                      ? formatCurrency(selectedUnit.rentAmount, currencyCode)
                      : "—"}
                  </p>
                </div>
              </InfoCard>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}