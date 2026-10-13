import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, ClipboardCheck, ShieldCheck, WalletCards, Droplets, UsersRound, FileText } from "lucide-react";
import { publicPageMetadata } from "@/lib/seo";
import { loginAction } from "./actions";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import LoginForm from "./LoginForm";

export const metadata = publicPageMetadata({
  title: "Sign in to EstateDesk",
  description: "Sign in to manage properties, leases, rent payments, maintenance, and your team in one connected EstateDesk workspace.",
  path: "/login",
});

const services = [
  { icon: Building2, title: "Properties & tenancies", description: "Organise properties, units, tenants, and leases in one place." },
  { icon: WalletCards, title: "Rent & payments", description: "Track invoices, collections, balances, and payment reconciliation." },
  { icon: Droplets, title: "Water billing", description: "Record meter readings and manage tenant water bills." },
  { icon: ClipboardCheck, title: "Inspections & maintenance", description: "Document property checks, report issues, and follow up on repairs." },
  { icon: UsersRound, title: "Staff & access", description: "Coordinate your team with permissions suited to each role." },
  { icon: FileText, title: "Records & reporting", description: "Keep documents, financial reports, and owner statements accessible." },
];

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params?.returnTo) ?? undefined;

  return (
    <div className="min-h-dvh bg-[#f7f9fa] text-slate-950 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <aside aria-labelledby="login-workflow-title" className="relative hidden flex-col justify-between overflow-hidden bg-[#102f35] px-10 py-10 text-white lg:flex xl:px-16">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-48 h-[600px] w-[600px] rounded-full border border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-28 h-[400px] w-[400px] rounded-full border border-white/5" />
        <Link href="/" className="relative inline-flex w-fit items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Building2 aria-hidden="true" className="h-6 w-6 text-teal-200" /></span>
          <span className="text-xl font-semibold tracking-tight">EstateDesk</span>
        </Link>

        <div className="relative my-9 w-full max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Property management, connected</p>
          <h2 id="login-workflow-title" className="mt-4 text-3xl font-semibold leading-[1.15] tracking-[-0.035em] xl:text-4xl">Your property operations.<br /><span className="text-teal-200">Working together.</span></h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">From the first lease to the monthly owner statement, manage the work behind every property in one connected workspace.</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {services.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-xl border border-white/15 bg-white/[0.04] p-4">
                <Icon aria-hidden="true" className="h-5 w-5 text-teal-200" />
                <h3 className="mt-3 text-sm font-semibold leading-5">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-300">{description}</p>
              </article>
            ))}
          </div>
          <Link href="/services" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-teal-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">Explore all services<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>

        <div className="relative flex items-start gap-3 border-t border-white/15 pt-6 text-sm leading-6 text-slate-300">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-teal-200" />
          <p>One workspace for your team.<br /><span className="text-white">Access tailored to each person’s role.</span></p>
        </div>
      </aside>

      <main id="main-content" className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-slate-600 transition hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /><span className="hidden sm:inline">Back to EstateDesk</span><span className="sm:hidden">EstateDesk</span>
          </Link>
          <Link href="/services" className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">Explore the platform<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </header>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="mb-7">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700"><Building2 aria-hidden="true" className="h-6 w-6" /></span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Your EstateDesk workspace</p>
            <h1 data-heading-icon="custom" className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Welcome back</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Sign in to stay on top of your properties, payments, and the work that needs your attention.</p>
          </div>

          <section aria-label="Sign in" className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            <LoginForm returnTo={returnTo} loginAction={loginAction} />
          </section>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">For managers, landlords, tenants, and caretakers.<br />Use the account provided by your organisation or property manager.</p>
          <div className="mt-8 border-t border-slate-200 pt-5 lg:hidden">
            <p className="text-sm font-semibold text-slate-800">Your property operations, connected.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Tenancies & leases · Rent & water billing · Maintenance & inspections</p>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} EstateDesk</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />Role-based access</span>
        </footer>
      </main>
    </div>
  );
}
