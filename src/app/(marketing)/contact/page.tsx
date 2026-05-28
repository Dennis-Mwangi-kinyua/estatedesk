import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Landmark,
  Mail,
  MessageSquare,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { ReferralCodeField } from "@/components/marketing/referral-code-field";
import { publicPageMetadata } from "@/lib/seo";
import { contactSalesAction } from "./actions";

export const metadata = publicPageMetadata({
  title: "Contact EstateDesk",
  description:
    "Contact EstateDesk for property management software rollout support in Kenya, including tenant management, billing workflows, caretaker operations, and enterprise onboarding.",
  path: "/contact",
});

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
      <span className="mb-1.5 block text-sm font-semibold text-slate-800">
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
    <div className={`mb-4 rounded-2xl border px-4 py-3 ${classes}`}>
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
  const inputClassName =
    "h-12 w-full rounded-2xl border border-slate-200/85 bg-white/90 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_48%,#ffffff_100%)] text-slate-950">
      <PublicAccessHeader active="contact" />

      <section className="relative overflow-hidden border-b border-white/80">
        <div className="pointer-events-none absolute left-1/2 top-[-120px] h-72 w-72 -translate-x-1/2 rounded-full bg-white/90 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] top-44 h-72 w-72 rounded-full bg-sky-200/45 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-10 lg:px-8 lg:py-14 xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="min-w-0">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/82 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-2xl">
              <Landmark className="h-3.5 w-3.5" />
              Enterprise property operations
            </div>

            <h1 className="mt-5 max-w-3xl text-[clamp(2.15rem,10vw,4.75rem)] font-semibold leading-[0.98] tracking-tight text-slate-950">
              Talk to sales about EstateDesk for your team.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Share the shape of your portfolio and the sales team will help
              map the right plan, onboarding path, and support model.
            </p>

            <div className="mt-6 grid gap-2.5 rounded-[1.5rem] border border-white/80 bg-white/74 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur-2xl sm:p-4">
              {fitPoints.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/75 bg-white/80 p-3"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {responseSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="rounded-[1.35rem] border border-white/80 bg-white/76 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur-2xl"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-4 text-sm font-semibold text-slate-950">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div
            id="contact-sales"
            className="rounded-[1.75rem] border border-white/85 bg-white/78 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl sm:p-5"
          >
            <StatusMessage message={message} />

            <div className="mb-5 flex items-start gap-3 border-b border-slate-200/80 pb-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Contact sales
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Send your details and the EstateDesk team will follow up.
                </p>
              </div>
            </div>

            <form action={contactSalesAction} className="space-y-3">
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
                    className={inputClassName}
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
                    className={inputClassName}
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
                  className={inputClassName}
                  placeholder="name@company.com"
                />
              </Field>

              <Field label="Phone number">
                <input
                  name="phone"
                  type="tel"
                  maxLength={40}
                  autoComplete="tel"
                  className={inputClassName}
                  placeholder="+254 700 000 000"
                />
              </Field>

              <ReferralCodeField defaultCode={referralCode} />

              <Field label="What do you manage?">
                <select
                  name="managedPropertyType"
                  required
                  className={inputClassName}
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
                  className="w-full resize-none rounded-2xl border border-slate-200/85 bg-white/90 px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  placeholder="Number of units, team size, billing pain points, or rollout timeline"
                />
              </Field>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Send sales request
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200/80 bg-white/78 p-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-950" />
                <span>Best for enterprise or guided setup conversations.</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-slate-950" />
                <span>Already ready to start? Create an account instead.</span>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-slate-500">
              Prefer self-service?{" "}
              <Link href="/register" className="font-semibold text-slate-950">
                Request onboarding
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
