import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  FileText,
  Home,
  KeyRound,
  Landmark,
  LockKeyhole,
  MessageSquare,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { createOnboardingRequestAction } from "./actions";
import { ReferralCodeField } from "@/components/marketing/referral-code-field";
import { RegisterStatusToast } from "./register-status-toast";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Sign Up - EstateDesk Dashboard",
  description:
    "Create an EstateDesk account or request workspace access for property management, tenant records, billing, maintenance, reports, and team onboarding.",
  path: "/register",
});

const features = [
  {
    title: "Property and unit control",
    description:
      "Keep properties, buildings, units, occupancy, deposits, vacancy status, and unit details in one structured workspace.",
    icon: Building2,
  },
  {
    title: "Tenant and lease records",
    description:
      "Maintain tenant profiles, lease terms, due dates, documents, and move-in or move-out activity without fragmented files.",
    icon: KeyRound,
  },
  {
    title: "Rent, water, and tax billing",
    description:
      "Generate charges, capture meter readings, track balances, and keep billing status visible to the right team members.",
    icon: Droplets,
  },
  {
    title: "Payments and receipts",
    description:
      "Record payments, verify transactions, preserve references, and support receipt workflows across rent and service charges.",
    icon: FileText,
  },
  {
    title: "Maintenance coordination",
    description:
      "Log issues, assign caretakers, attach supporting details, prioritize urgent work, and monitor resolution progress.",
    icon: Wrench,
  },
  {
    title: "Inspections and move-outs",
    description:
      "Coordinate notices, inspections, checklists, approvals, and closure steps with a clear operational trail.",
    icon: ClipboardCheck,
  },
  {
    title: "Role-based access",
    description:
      "Give managers, accountants, office teams, caretakers, tenants, landlords, and platform admins the right permissions.",
    icon: ShieldCheck,
  },
  {
    title: "Notifications and audit trails",
    description:
      "Keep people informed through in-app, SMS, WhatsApp, or email updates while recording key platform actions.",
    icon: Bell,
  },
];

const operatingHighlights = [
  "Built for property managers, landlords, and operations teams",
  "Supports multi-role teams with controlled access",
  "Designed for daily billing, maintenance, and tenant workflows",
];

const workflow = [
  {
    title: "Request access",
    description: "Share your portfolio size, team setup, and operational needs.",
  },
  {
    title: "Platform review",
    description: "The EstateDesk team reviews your request and confirms the right setup path.",
  },
  {
    title: "Guided onboarding",
    description: "Your organization, roles, properties, and core workflows are prepared for rollout.",
  },
  {
    title: "Operational handover",
    description: "Your team starts managing tenants, billing, tasks, and reports from one workspace.",
  },
];

type SearchParams = Promise<{
  request?: string;
  ref?: string;
  referral?: string;
}>;

type RequestMessage = {
  tone: "success" | "warning";
  title: string;
  text: string;
};

function requestMessage(status?: string): RequestMessage | null {
  if (status === "sent") {
    return {
      tone: "success",
      title: "Onboarding request received",
      text: "Thank you. The EstateDesk team has received your request and will follow up with the right onboarding path.",
    };
  }

  if (status === "limited") {
    return {
      tone: "warning",
      title: "Request limit reached",
      text: "We received several requests from this contact recently. Please wait a little before submitting again.",
    };
  }

  if (status === "invalid") {
    return {
      tone: "warning",
      title: "Some details need attention",
      text: "Please confirm your name, company, work email, and property type before submitting again.",
    };
  }

  if (status === "needs-access") {
    return {
      tone: "warning",
      title: "Access required",
      text: "This account isn't linked to an organization yet. Please request access so we can connect your workspace.",
    };
  }

  return null;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const message = requestMessage(params.request);
  const referralCode = (params.ref ?? params.referral ?? "").trim();

  return (
    <main className="ed-theme-page min-h-screen bg-background text-foreground">
      <RegisterStatusToast message={message} />
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-950 text-white">
              <Home className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              EstateDesk
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Sign in
            </Link>
            <a
              href="#request-access"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Request access
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8 lg:py-16 xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="min-w-0">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
              <Landmark className="h-3.5 w-3.5" />
              Professional property management platform
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
              A controlled operating system for serious property teams.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
              EstateDesk helps property managers and landlords bring tenant
              records, leases, billing, payments, maintenance, inspections, and
              staff accountability into one reliable workspace.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#request-access"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Request onboarding
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
              >
                Review capabilities
              </a>
            </div>

            <div className="mt-8 grid gap-3">
              {operatingHighlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-neutral-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="grid gap-px bg-neutral-200 sm:grid-cols-3">
                {[
                  ["Portfolio visibility", "Properties, units, tenants, leases"],
                  ["Financial control", "Rent, water, receipts, balances"],
                  ["Operational accountability", "Tasks, inspections, audit trails"],
                ].map(([title, description]) => (
                  <div key={title} className="bg-white p-4">
                    <p className="text-sm font-semibold text-neutral-950">
                      {title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-neutral-500">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            id="request-access"
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-5 flex items-start gap-3 border-b border-neutral-200 pb-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-white">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                  Request access
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Submit your details and the platform team will follow up with
                  the correct onboarding path for your organization.
                </p>
              </div>
            </div>

            <form action={createOnboardingRequestAction} className="space-y-3">
              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name">
                  <input
                    name="fullName"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    placeholder="Jane Wanjiku"
                  />
                </Field>

                <Field label="Company">
                  <input
                    name="companyName"
                    type="text"
                    required
                    minLength={2}
                    maxLength={160}
                    autoComplete="organization"
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    placeholder="Acme Properties"
                  />
                </Field>
              </div>

              <Field label="Work email">
                <input
                  name="workEmail"
                  type="email"
                  required
                  maxLength={160}
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                  placeholder="name@company.com"
                />
              </Field>

              <Field label="Phone number">
                <input
                  name="phone"
                  type="tel"
                  maxLength={40}
                  autoComplete="tel"
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                  placeholder="+254 700 000 000"
                />
              </Field>

              <ReferralCodeField defaultCode={referralCode} />

              <Field label="What do you manage?">
                <select
                  name="managedPropertyType"
                  required
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                >
                  <option value="Residential properties">Residential properties</option>
                  <option value="Commercial properties">Commercial properties</option>
                  <option value="Mixed-use properties">Mixed-use properties</option>
                  <option value="Warehouses / godowns">Warehouses / godowns</option>
                  <option value="Multiple property types">Multiple property types</option>
                </select>
              </Field>

              <Field label="Message">
                <textarea
                  name="message"
                  rows={4}
                  maxLength={1200}
                  className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                  placeholder="Number of units, team size, billing pain points, or rollout timeline"
                />
              </Field>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Contact marketing team
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-neutral-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-neutral-950">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-neutral-200 bg-[#f6f7f9]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-neutral-600">
                Platform capabilities
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                Built around the work your team repeats every day.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                EstateDesk is designed to reduce operational delay, clarify
                accountability, and keep core property data reliable as your
                portfolio grows.
              </p>
              <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-4 text-sm leading-6 text-neutral-600">
                <LockKeyhole className="mb-3 h-5 w-5 text-neutral-950" />
                Role-aware access keeps sensitive operational, tenant, and
                financial information available only to the right people.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-neutral-950">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-neutral-600">
                From request to rollout
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                A professional onboarding path, not a self-serve guess.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                The request process helps us understand your portfolio,
                operational structure, and priorities before your workspace is
                prepared.
              </p>
            </div>

            <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
              {workflow.map((item, index) => (
                <div key={item.title} className="flex gap-4 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-neutral-950">
            <Landmark className="h-6 w-6" />
          </div>
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to bring structure to your property operations?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
            Share your onboarding request and the EstateDesk team will review
            the best setup path for your organization.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#request-access"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
            >
              Request access
              <ArrowRight className="h-4 w-4" />
            </a>

            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
      </span>
      {children}
    </label>
  );
}
