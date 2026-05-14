import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Home,
  Landmark,
  Mail,
  MessageSquare,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { contactSalesAction } from "./actions";

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

const fitPoints = [
  "Large portfolios that need guided rollout",
  "Teams moving billing, issues, and inspections into one workspace",
  "Organizations that need custom onboarding and governance support",
];

const responseSteps = [
  {
    title: "Share your rollout goals",
    description:
      "Tell us about your portfolio, team structure, and operational priorities.",
    icon: MessageSquare,
  },
  {
    title: "Sales review",
    description:
      "The EstateDesk team reviews the request and confirms the best setup path.",
    icon: ClipboardList,
  },
  {
    title: "Enterprise onboarding",
    description:
      "We align configuration, access, and support around your organization.",
    icon: ShieldCheck,
  },
];

function requestMessage(status?: string): RequestMessage | null {
  if (status === "sent") {
    return {
      tone: "success",
      title: "Sales request received",
      text: "Thank you. The EstateDesk team has received your request and will follow up with the right next step.",
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

  return null;
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
      <span className="mb-1.5 block text-sm font-medium text-neutral-800">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusMessage({ message }: { message: RequestMessage | null }) {
  if (!message) return null;

  const classes =
    message.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 ${classes}`}>
      <p className="text-sm font-semibold">{message.title}</p>
      <p className="mt-1 text-sm leading-6">{message.text}</p>
    </div>
  );
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const message = requestMessage(params.request);
  const referralCode = (params.ref ?? params.referral ?? "").trim();

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-neutral-950">
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
              href="/pricing"
              className="hidden h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-950 px-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8 lg:py-16 xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="min-w-0">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
              <Landmark className="h-3.5 w-3.5" />
              Enterprise property operations
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
              Talk to sales about EstateDesk for your team.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
              Share the shape of your portfolio and the sales team will help
              map the right plan, onboarding path, and support model.
            </p>

            <div className="mt-8 grid gap-3">
              {fitPoints.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-neutral-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {responseSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-neutral-900">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-4 text-sm font-semibold text-neutral-950">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div
            id="contact-sales"
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <StatusMessage message={message} />

            <div className="mb-5 flex items-start gap-3 border-b border-neutral-200 pb-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-white">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                  Contact sales
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Send your details and the EstateDesk team will follow up.
                </p>
              </div>
            </div>

            <form action={contactSalesAction} className="space-y-3">
              <input type="hidden" name="referralCode" value={referralCode} />
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

              <Field label="What do you manage?">
                <select
                  name="managedPropertyType"
                  required
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                >
                  <option value="Residential properties">
                    Residential properties
                  </option>
                  <option value="Commercial properties">
                    Commercial properties
                  </option>
                  <option value="Mixed-use properties">
                    Mixed-use properties
                  </option>
                  <option value="Warehouses / godowns">
                    Warehouses / godowns
                  </option>
                  <option value="Multiple property types">
                    Multiple property types
                  </option>
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
                Send sales request
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 grid gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-neutral-950" />
                <span>Best for enterprise or guided setup conversations.</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-neutral-950" />
                <span>Already ready to start? Create an account instead.</span>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-neutral-500">
              Prefer self-service?{" "}
              <Link href="/register" className="font-semibold text-neutral-950">
                Request onboarding
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
