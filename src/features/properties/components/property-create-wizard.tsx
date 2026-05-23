"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { createPropertyAction } from "@/features/properties/actions/create-property-action";
import { PropertyUnitPlanBuilder } from "@/features/properties/components/property-unit-plan-builder";

const PROPERTY_TYPES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "MIXED_USE", label: "Mixed use" },
  { value: "GODOWN", label: "Godown" },
] as const;

const STEPS = [
  {
    id: 1,
    title: "Property profile",
    description: "Basic identity, classification, and taxpayer linkage.",
  },
  {
    id: 2,
    title: "Landlord",
    description: "Link ownership and login access.",
  },
  {
    id: 3,
    title: "Billing & status",
    description: "Water billing defaults and availability settings.",
  },
  {
    id: 4,
    title: "Unit mix",
    description: "Define the units that should be created automatically.",
  },
  {
    id: 5,
    title: "Review",
    description: "Confirm details before creating the property.",
  },
] as const;

type TaxpayerProfileOption = {
  id: string;
  displayName: string;
  kraPin: string;
  kind: string;
};

type LandlordProfileOption = {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
};

type ReviewSummary = {
  name: string;
  type: string;
  taxpayerProfile: string;
  landlord: string;
  location: string;
  address: string;
  notes: string;
  waterRatePerUnit: string;
  waterFixedCharge: string;
  isActive: boolean;
  unitMixCount: number;
  totalGeneratedUnits: number;
  unitMixLabels: string[];
};

function formatPropertyType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUnitTypeLabel(unitType: string, bedrooms: string) {
  if (unitType === "APARTMENT" && bedrooms) {
    return `${bedrooms} Bedroom Apartment`;
  }

  return unitType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(value: string, currencyCode: string) {
  const amount = Number(value);

  if (!value || Number.isNaN(amount)) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function PropertyCreateWizard({
  orgName,
  currencyCode,
  errorMessage,
  taxpayerProfiles,
  landlordProfiles,
}: {
  orgName: string;
  currencyCode: string;
  errorMessage: string | null;
  taxpayerProfiles: TaxpayerProfileOption[];
  landlordProfiles: LandlordProfileOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [landlordMode, setLandlordMode] = useState<"none" | "existing" | "new">(
    "none",
  );

  const taxpayerProfileMap = useMemo(() => {
    return new Map(
      taxpayerProfiles.map((profile) => [
        profile.id,
        `${profile.displayName} - ${profile.kraPin} (${profile.kind})`,
      ]),
    );
  }, [taxpayerProfiles]);

  const landlordProfileMap = useMemo(() => {
    return new Map(
      landlordProfiles.map((profile) => [
        profile.id,
        [
          profile.displayName,
          profile.phone,
          profile.email,
        ]
          .filter(Boolean)
          .join(" - "),
      ]),
    );
  }, [landlordProfiles]);

  function validateCurrentStep() {
    const form = formRef.current;
    if (!form) return true;

    const data = new FormData(form);

    if (currentStep === 1) {
      const name = String(data.get("name") ?? "").trim();
      const type = String(data.get("type") ?? "").trim();

      if (!name) {
        setStepError("Property name is required before continuing.");
        return false;
      }

      if (!type) {
        setStepError("Property type is required before continuing.");
        return false;
      }
    }

    if (currentStep === 2) {
      const mode = String(data.get("landlordMode") ?? "none");

      if (mode === "existing") {
        const existingLandlordProfileId = String(
          data.get("existingLandlordProfileId") ?? "",
        ).trim();

        if (!existingLandlordProfileId) {
          setStepError("Choose an existing landlord before continuing.");
          return false;
        }
      }

      if (mode === "new") {
        const fullName = String(data.get("landlordFullName") ?? "").trim();
        const username = String(data.get("landlordUsername") ?? "").trim();
        const password = String(data.get("landlordPassword") ?? "").trim();

        if (!fullName) {
          setStepError("Landlord full name is required.");
          return false;
        }

        if (username.length < 3) {
          setStepError("Landlord username must be at least 3 characters.");
          return false;
        }

        if (password.length < 8) {
          setStepError("Landlord password must be at least 8 characters.");
          return false;
        }
      }
    }

    if (currentStep === 3) {
      const waterRate = String(data.get("waterRatePerUnit") ?? "").trim();
      const waterFixed = String(data.get("waterFixedCharge") ?? "").trim();

      if (waterRate && Number.isNaN(Number(waterRate))) {
        setStepError("Water rate per unit must be a valid number.");
        return false;
      }

      if (waterFixed && Number.isNaN(Number(waterFixed))) {
        setStepError("Water fixed charge must be a valid number.");
        return false;
      }
    }

    setStepError(null);
    return true;
  }

  function buildReviewSummary() {
    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const type = String(data.get("type") ?? "").trim();
    const taxpayerProfileId = String(data.get("taxpayerProfileId") ?? "").trim();
    const landlordModeValue = String(data.get("landlordMode") ?? "none");
    const existingLandlordProfileId = String(
      data.get("existingLandlordProfileId") ?? "",
    ).trim();
    const landlordFullName = String(data.get("landlordFullName") ?? "").trim();
    const landlordUsername = String(data.get("landlordUsername") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();
    const waterRatePerUnit = String(data.get("waterRatePerUnit") ?? "").trim();
    const waterFixedCharge = String(data.get("waterFixedCharge") ?? "").trim();
    const isActive = data.get("isActive") === "on";

    const unitTypes = data
      .getAll("unitPlanUnitType[]")
      .map((value) => String(value).trim());

    const bedrooms = data
      .getAll("unitPlanBedrooms[]")
      .map((value) => String(value).trim());

    const quantities = data
      .getAll("unitPlanQuantity[]")
      .map((value) => String(value).trim());

    const labels: string[] = [];
    let totalGeneratedUnits = 0;

    for (let index = 0; index < unitTypes.length; index += 1) {
      const unitType = unitTypes[index] ?? "";
      const bedroomValue = bedrooms[index] ?? "";
      const quantityValue = quantities[index] ?? "";

      if (!unitType) continue;

      const quantity = Number.parseInt(quantityValue || "0", 10);
      totalGeneratedUnits += Number.isFinite(quantity) ? quantity : 0;

      labels.push(
        `${formatUnitTypeLabel(unitType, bedroomValue)}${
          quantity > 0 ? ` x ${quantity}` : ""
        }`,
      );
    }

    setReviewSummary({
      name: name || "—",
      type: type ? formatPropertyType(type) : "—",
      taxpayerProfile: taxpayerProfileId
        ? taxpayerProfileMap.get(taxpayerProfileId) ?? "Selected profile"
        : "No linked taxpayer profile",
      landlord:
        landlordModeValue === "existing" && existingLandlordProfileId
          ? landlordProfileMap.get(existingLandlordProfileId) ?? "Selected landlord"
          : landlordModeValue === "new"
            ? `${landlordFullName || "New landlord"} (${landlordUsername || "no username"})`
            : "No landlord linked",
      location: location || "—",
      address: address || "—",
      notes: notes || "No notes added",
      waterRatePerUnit: formatCurrency(waterRatePerUnit, currencyCode),
      waterFixedCharge: formatCurrency(waterFixedCharge, currencyCode),
      isActive,
      unitMixCount: labels.length,
      totalGeneratedUnits,
      unitMixLabels: labels,
    });
  }

  function handleNext() {
    if (!validateCurrentStep()) return;

    if (currentStep === 4) {
      buildReviewSummary();
    }

    setCurrentStep((step) => Math.min(step + 1, STEPS.length));
  }

  function handleBack() {
    setStepError(null);
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                Property setup wizard
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                Create new property
              </h1>

              <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base">
                Add a property under <span className="font-medium">{orgName}</span>.
                This guided flow helps you capture the property profile, billing
                defaults, and the initial unit mix in a structured way.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/org/properties"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Back to properties
              </Link>
            </div>
          </div>
        </div>

        <div className="border-b border-neutral-200 bg-neutral-50/70 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className={`rounded-2xl border px-4 py-4 transition ${
                    isActive
                      ? "border-neutral-900 bg-white"
                      : isComplete
                        ? "border-green-200 bg-green-50"
                        : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        isActive
                          ? "bg-neutral-950 text-white"
                          : isComplete
                            ? "bg-green-600 text-white"
                            : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {isComplete ? "✓" : step.id}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-950">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="px-5 py-6 sm:px-6">
            {errorMessage ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {stepError ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {stepError}
              </div>
            ) : null}

            <form
              ref={formRef}
              action={createPropertyAction}
              noValidate
              className="space-y-8"
            >
              <section className={currentStep === 1 ? "block" : "hidden"}>
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950">
                      Property profile
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Define the basic identity of the property and how it should
                      appear across the platform.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Property name <span className="text-red-500">*</span>
                      </span>
                      <input
                        name="name"
                        type="text"
                        maxLength={120}
                        placeholder="Greenview Apartments"
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Property type <span className="text-red-500">*</span>
                      </span>
                      <select
                        name="type"
                        defaultValue="RESIDENTIAL"
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      >
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Taxpayer profile
                      </span>
                      <select
                        name="taxpayerProfileId"
                        defaultValue=""
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      >
                        <option value="">No linked taxpayer profile</option>
                        {taxpayerProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.displayName} - {profile.kraPin} ({profile.kind})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Location
                      </span>
                      <input
                        name="location"
                        type="text"
                        maxLength={160}
                        placeholder="Kilimani, Nairobi"
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Address
                      </span>
                      <input
                        name="address"
                        type="text"
                        maxLength={220}
                        placeholder="Wood Avenue, Block A"
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Notes
                      </span>
                      <textarea
                        name="notes"
                        rows={5}
                        maxLength={1500}
                        placeholder="Internal notes, management remarks, or operational context."
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section className={currentStep === 2 ? "block" : "hidden"}>
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950">
                      Landlord ownership
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Link this property to an existing landlord or create a new
                      landlord account with exclusive property-scoped access.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      {
                        value: "none",
                        title: "No landlord",
                        description: "Create the property without owner access.",
                      },
                      {
                        value: "existing",
                        title: "Existing landlord",
                        description: "Attach this property to a landlord profile.",
                      },
                      {
                        value: "new",
                        title: "New landlord",
                        description: "Create login credentials and link ownership.",
                      },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`block rounded-2xl border p-4 transition ${
                          landlordMode === option.value
                            ? "border-neutral-950 bg-neutral-50"
                            : "border-neutral-200 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="landlordMode"
                          value={option.value}
                          checked={landlordMode === option.value}
                          onChange={() =>
                            setLandlordMode(option.value as typeof landlordMode)
                          }
                          className="sr-only"
                        />
                        <span className="block text-sm font-semibold text-neutral-950">
                          {option.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-neutral-500">
                          {option.description}
                        </span>
                      </label>
                    ))}
                  </div>

                  {landlordMode === "existing" ? (
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Select landlord <span className="text-red-500">*</span>
                      </span>
                      <select
                        name="existingLandlordProfileId"
                        defaultValue=""
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      >
                        <option value="">Choose landlord</option>
                        {landlordProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {[profile.displayName, profile.phone, profile.email]
                              .filter(Boolean)
                              .join(" - ")}
                          </option>
                        ))}
                      </select>
                      {landlordProfiles.length === 0 ? (
                        <span className="mt-2 block text-xs text-amber-700">
                          No landlord profiles found. Choose “New landlord” to
                          create one.
                        </span>
                      ) : null}
                    </label>
                  ) : null}

                  {landlordMode === "new" ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">
                          Full name <span className="text-red-500">*</span>
                        </span>
                        <input
                          name="landlordFullName"
                          type="text"
                          maxLength={120}
                          placeholder="Jane Wanjiku"
                          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">
                          Username <span className="text-red-500">*</span>
                        </span>
                        <input
                          name="landlordUsername"
                          type="text"
                          minLength={3}
                          maxLength={60}
                          autoComplete="username"
                          placeholder="jane-landlord"
                          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">
                          Password <span className="text-red-500">*</span>
                        </span>
                        <input
                          name="landlordPassword"
                          type="password"
                          minLength={8}
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">
                          Email
                        </span>
                        <input
                          name="landlordEmail"
                          type="email"
                          autoComplete="email"
                          placeholder="owner@example.com"
                          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">
                          Mobile number
                        </span>
                        <input
                          name="landlordPhone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="0712345678"
                          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">
                          National ID
                        </span>
                        <input
                          name="landlordNationalId"
                          type="text"
                          maxLength={80}
                          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">
                          Notes
                        </span>
                        <textarea
                          name="landlordNotes"
                          rows={3}
                          maxLength={1000}
                          placeholder="Ownership notes or contact preferences."
                          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                    Landlord access is property-scoped. A landlord account created
                    here will only see this linked apartment/property and its units.
                  </div>
                </div>
              </section>

              <section className={currentStep === 3 ? "block" : "hidden"}>
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950">
                      Billing & availability
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Configure default water billing values and decide whether the
                      property should be active immediately.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Water rate per unit ({currencyCode})
                      </span>
                      <input
                        name="waterRatePerUnit"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="75.00"
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Water fixed charge ({currencyCode})
                      </span>
                      <input
                        name="waterFixedCharge"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="250.00"
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <label className="flex items-start gap-3">
                      <input
                        name="isActive"
                        type="checkbox"
                        defaultChecked
                        className="mt-1 h-4 w-4 rounded border-neutral-300"
                      />
                      <span>
                        <span className="block text-sm font-medium text-neutral-800">
                          Active on creation
                        </span>
                        <span className="mt-1 block text-sm text-neutral-500">
                          Active properties can be used immediately across units,
                          leases, maintenance, reporting, and billing workflows.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              <section className={currentStep === 4 ? "block" : "hidden"}>
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950">
                      Initial unit mix
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Add the unit mix for this property. On submit, the system will
                      save the plan and generate the actual units automatically.
                    </p>
                  </div>

                  <PropertyUnitPlanBuilder currencyCode={currencyCode} />
                </div>
              </section>

              <section className={currentStep === 5 ? "block" : "hidden"}>
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950">
                      Review & create
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Confirm the details below before creating the property and its
                      initial units.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                        Property profile
                      </p>

                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-neutral-500">Name</dt>
                          <dd className="text-right font-medium text-neutral-900">
                            {reviewSummary?.name ?? "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-neutral-500">Type</dt>
                          <dd className="text-right font-medium text-neutral-900">
                            {reviewSummary?.type ?? "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-neutral-500">Taxpayer profile</dt>
                          <dd className="max-w-[60%] text-right font-medium text-neutral-900">
                            {reviewSummary?.taxpayerProfile ?? "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-neutral-500">Landlord</dt>
                          <dd className="max-w-[60%] text-right font-medium text-neutral-900">
                            {reviewSummary?.landlord ?? "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-neutral-500">Location</dt>
                          <dd className="text-right font-medium text-neutral-900">
                            {reviewSummary?.location ?? "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-neutral-500">Address</dt>
                          <dd className="text-right font-medium text-neutral-900">
                            {reviewSummary?.address ?? "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                        Billing & status
                      </p>

                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-neutral-500">Water rate</dt>
                          <dd className="text-right font-medium text-neutral-900">
                            {reviewSummary?.waterRatePerUnit ?? "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-neutral-500">Fixed charge</dt>
                          <dd className="text-right font-medium text-neutral-900">
                            {reviewSummary?.waterFixedCharge ?? "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-neutral-500">Status</dt>
                          <dd className="text-right font-medium text-neutral-900">
                            {reviewSummary?.isActive ? "Active" : "Inactive"}
                          </dd>
                        </div>
                        <div className="pt-2">
                          <dt className="text-neutral-500">Notes</dt>
                          <dd className="mt-2 rounded-xl bg-white p-3 text-neutral-700">
                            {reviewSummary?.notes ?? "No notes added"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 lg:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                        Unit generation summary
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Unit mix rows
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-neutral-950">
                            {reviewSummary?.unitMixCount ?? 0}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Generated units
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-neutral-950">
                            {reviewSummary?.totalGeneratedUnits ?? 0}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Destination
                          </p>
                          <p className="mt-2 text-sm font-medium text-neutral-900">
                            Units will appear on the units page immediately
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
                        <p className="text-sm font-semibold text-neutral-900">
                          Unit mix preview
                        </p>

                        {reviewSummary?.unitMixLabels?.length ? (
                          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                            {reviewSummary.unitMixLabels.map((item) => (
                              <li key={item}>• {item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-neutral-500">
                            No unit mix rows added. The property will be created
                            without initial units.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-neutral-500">
                  Step {currentStep} of {STEPS.length}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Back
                    </button>
                  ) : (
                    <Link
                      href="/dashboard/org/properties"
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Cancel
                    </Link>
                  )}

                  {currentStep < STEPS.length ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-4 focus:ring-neutral-200"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-4 focus:ring-neutral-200"
                    >
                      Create property
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          <aside className="border-t border-neutral-200 bg-neutral-50/70 px-5 py-6 sm:px-6 lg:border-l lg:border-t-0">
            <div className="space-y-5">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Why this setup works
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
                  <li>• Keeps long forms focused and easy to complete</li>
                  <li>• Reduces input fatigue on mobile</li>
                  <li>• Captures unit mix before final creation</li>
                  <li>• Gives a final review before submission</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Recommended sequence
                </h3>
                <div className="mt-3 space-y-2 text-sm text-neutral-600">
                  <p>1. Add the property profile</p>
                  <p>2. Configure water defaults</p>
                  <p>3. Add residential or commercial unit mix</p>
                  <p>4. Review and create</p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Numbering tip
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  Prefixes like A, B, SH, OF, or GD help generate clean unit numbers
                  such as A01, A02, SH01, and OF01.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
