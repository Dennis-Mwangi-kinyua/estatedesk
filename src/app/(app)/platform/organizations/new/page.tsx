"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User2,
} from "lucide-react";
import {
  createOrganizationAction,
  type CreateOrganizationState,
} from "./actions";

const initialState: CreateOrganizationState = {
  success: false,
};

const steps = [
  { id: 1, title: "Organization" },
  { id: 2, title: "Admin account" },
  { id: 3, title: "Review" },
];

export default function NewOrganizationPage() {
  const [state, formAction, pending] = useActionState(
    createOrganizationAction,
    initialState,
  );
  const [step, setStep] = useState(1);

  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");
  const [organizationPhone, setOrganizationPhone] = useState("");
  const [organizationAddress, setOrganizationAddress] = useState("");
  const [currencyCode, setCurrencyCode] = useState("KES");
  const [timezone, setTimezone] = useState("Africa/Nairobi");
  const [dataRetentionDays, setDataRetentionDays] = useState("2555");
  const [plan, setPlan] = useState("FREE");

  const [adminFullName, setAdminFullName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");

  const generatedSlug = useMemo(() => {
    const base = organizationSlug || organizationName;
    return base
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }, [organizationName, organizationSlug]);

  function canGoStep2() {
    return (
      organizationName.trim().length >= 2 &&
      timezone.trim().length > 0 &&
      plan.trim().length > 0
    );
  }

  function canGoStep3() {
    return (
      adminFullName.trim().length >= 2 &&
      adminEmail.trim().length > 0 &&
      adminPassword.length >= 8 &&
      adminPassword === adminPasswordConfirm
    );
  }

  function nextStep() {
    if (step === 1 && canGoStep2()) {
      setStep(2);
      return;
    }

    if (step === 2 && canGoStep3()) {
      setStep(3);
    }
  }

  function prevStep() {
    setStep((current) => Math.max(1, current - 1));
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Link href="/platform" className="hover:text-neutral-900">
                Platform
              </Link>
              <span>/</span>
              <Link
                href="/platform/organizations"
                className="hover:text-neutral-900"
              >
                Organizations
              </Link>
              <span>/</span>
              <span className="text-neutral-900">New</span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Create organization
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Set up a new organization workspace and its first admin account.
            </p>
          </div>

          <Link
            href="/platform/organizations"
            className="hidden rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-neutral-100 sm:inline-flex"
          >
            Back
          </Link>
        </div>

        <div className="mb-6 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {steps.map((item) => {
              const active = item.id === step;
              const completed = item.id < step;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border px-3 py-3 text-center sm:px-4 ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : completed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-neutral-200 bg-neutral-50 text-neutral-500"
                  }`}
                >
                  <div className="mb-1 text-xs font-medium sm:text-sm">
                    Step {item.id}
                  </div>
                  <div className="text-sm font-semibold sm:text-base">
                    {item.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {state.error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="organizationName" value={organizationName} />
          <input type="hidden" name="organizationSlug" value={organizationSlug} />
          <input type="hidden" name="organizationEmail" value={organizationEmail} />
          <input type="hidden" name="organizationPhone" value={organizationPhone} />
          <input
            type="hidden"
            name="organizationAddress"
            value={organizationAddress}
          />
          <input type="hidden" name="currencyCode" value={currencyCode} />
          <input type="hidden" name="timezone" value={timezone} />
          <input
            type="hidden"
            name="dataRetentionDays"
            value={dataRetentionDays}
          />
          <input type="hidden" name="plan" value={plan} />
          <input type="hidden" name="adminFullName" value={adminFullName} />
          <input type="hidden" name="adminEmail" value={adminEmail} />
          <input type="hidden" name="adminPhone" value={adminPhone} />
          <input type="hidden" name="adminPassword" value={adminPassword} />
          <input
            type="hidden"
            name="adminPasswordConfirm"
            value={adminPasswordConfirm}
          />

          {step === 1 ? (
            <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="inline-flex rounded-full bg-neutral-100 p-2">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold">Organization details</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Add the main workspace details and default organization settings.
                </p>
              </div>

              <div className="grid gap-4">
                <Field
                  label="Organization name"
                  required
                  error={state.fieldErrors?.organizationName?.[0]}
                >
                  <input
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Greenview Properties Ltd"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </Field>

                <Field label="Slug">
                  <input
                    value={organizationSlug}
                    onChange={(e) => setOrganizationSlug(e.target.value)}
                    placeholder="greenview-properties"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Generated slug:{" "}
                    <span className="font-medium">{generatedSlug || "—"}</span>
                  </p>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Organization email"
                    error={state.fieldErrors?.organizationEmail?.[0]}
                  >
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="email"
                        value={organizationEmail}
                        onChange={(e) => setOrganizationEmail(e.target.value)}
                        placeholder="info@greenview.co.ke"
                        className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400"
                      />
                    </div>
                  </Field>

                  <Field label="Organization phone">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        value={organizationPhone}
                        onChange={(e) => setOrganizationPhone(e.target.value)}
                        placeholder="+254700000000"
                        className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400"
                      />
                    </div>
                  </Field>
                </div>

                <Field label="Address">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-neutral-400" />
                    <textarea
                      value={organizationAddress}
                      onChange={(e) => setOrganizationAddress(e.target.value)}
                      placeholder="Westlands, Nairobi"
                      rows={4}
                      className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400"
                    />
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Currency code">
                    <input
                      value={currencyCode}
                      onChange={(e) =>
                        setCurrencyCode(e.target.value.toUpperCase())
                      }
                      placeholder="KES"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-neutral-400"
                    />
                  </Field>

                  <Field
                    label="Timezone"
                    required
                    error={state.fieldErrors?.timezone?.[0]}
                  >
                    <input
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="Africa/Nairobi"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                    />
                  </Field>

                  <Field
                    label="Data retention days"
                    error={state.fieldErrors?.dataRetentionDays?.[0]}
                  >
                    <input
                      type="number"
                      min={1}
                      value={dataRetentionDays}
                      onChange={(e) => setDataRetentionDays(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                    />
                  </Field>
                </div>

                <Field label="Plan" required error={state.fieldErrors?.plan?.[0]}>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  >
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                    <option value="PLUS">Plus</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </Field>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="inline-flex rounded-full bg-neutral-100 p-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold">First admin account</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Create the initial organization admin who will manage the new
                  workspace.
                </p>
              </div>

              <div className="grid gap-4">
                <Field
                  label="Admin full name"
                  required
                  error={state.fieldErrors?.adminFullName?.[0]}
                >
                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={adminFullName}
                      onChange={(e) => setAdminFullName(e.target.value)}
                      placeholder="Dennis Mwangi"
                      className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400"
                    />
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Admin email"
                    required
                    error={state.fieldErrors?.adminEmail?.[0]}
                  >
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@greenview.co.ke"
                        className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400"
                      />
                    </div>
                  </Field>

                  <Field label="Admin phone">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="+254700000001"
                        className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400"
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Password"
                    required
                    error={state.fieldErrors?.adminPassword?.[0]}
                  >
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400"
                      />
                    </div>
                  </Field>

                  <Field
                    label="Confirm password"
                    required
                    error={state.fieldErrors?.adminPasswordConfirm?.[0]}
                  >
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="password"
                        value={adminPasswordConfirm}
                        onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400"
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="inline-flex rounded-full bg-emerald-50 p-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold">Review and create</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Confirm the organization details and the first admin account before
                  creating the workspace.
                </p>
              </div>

              <div className="grid gap-4">
                <ReviewCard
                  title="Organization"
                  items={[
                    ["Name", organizationName || "—"],
                    ["Slug", generatedSlug || "—"],
                    ["Email", organizationEmail || "—"],
                    ["Phone", organizationPhone || "—"],
                    ["Address", organizationAddress || "—"],
                    ["Currency", currencyCode || "—"],
                    ["Timezone", timezone || "—"],
                    ["Plan", plan || "—"],
                    ["Retention", `${dataRetentionDays || "—"} days`],
                  ]}
                />

                <ReviewCard
                  title="Admin account"
                  items={[
                    ["Full name", adminFullName || "—"],
                    ["Login email", adminEmail || "—"],
                    ["Phone", adminPhone || "—"],
                    ["Org role", "ADMIN"],
                    ["Platform role", "USER"],
                  ]}
                />
              </div>
            </section>
          ) : null}

          <div className="sticky bottom-3 rounded-3xl border border-neutral-200 bg-white p-3 shadow-lg backdrop-blur sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-neutral-500">
                Step {step} of {steps.length}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1 || pending}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      pending ||
                      (step === 1 && !canGoStep2()) ||
                      (step === 2 && !canGoStep3())
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    {pending ? "Creating..." : "Create organization"}
                    {!pending ? <CheckCircle2 className="h-4 w-4" /> : null}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function ReviewCard({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-3 last:border-b-0 last:pb-0"
          >
            <span className="text-sm text-neutral-500">{label}</span>
            <span className="text-right text-sm font-medium text-neutral-900">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}