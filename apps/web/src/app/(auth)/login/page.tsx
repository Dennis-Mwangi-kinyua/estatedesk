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
  { icon: Building2, title: "Properties & tenancies", background: "#eff6ff", border: "#bfdbfe", ink: "#1d4ed8", description: "Organise properties, units, tenants, and leases in one place." },
  { icon: WalletCards, title: "Rent & payments", background: "#ecfdf5", border: "#a7f3d0", ink: "#047857", description: "Track invoices, collections, balances, and payment reconciliation." },
  { icon: Droplets, title: "Water billing", background: "#f0f9ff", border: "#bae6fd", ink: "#0369a1", description: "Record meter readings and manage tenant water bills." },
  { icon: ClipboardCheck, title: "Inspections & maintenance", background: "#fffbeb", border: "#fde68a", ink: "#b45309", description: "Document property checks, report issues, and follow up on repairs." },
  { icon: UsersRound, title: "Staff & access", background: "#f0fdfa", border: "#99f6e4", ink: "#0f766e", description: "Coordinate your team with permissions suited to each role." },
  { icon: FileText, title: "Records & reporting", background: "#fff7ed", border: "#fed7aa", ink: "#c2410c", description: "Keep documents, financial reports, and owner statements accessible." },
];

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params?.returnTo) ?? undefined;

  return (
    <div className="login-page min-h-dvh bg-[#f7f9fa] text-slate-950 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <style>{`
        @media (min-width: 1024px) {
          body:has(.login-page) { overflow: hidden; }
          .login-page { position: fixed; inset: 0; overflow-y: auto; min-height: 100dvh; }
          .login-services { padding: 24px 32px; }
          .login-overview { margin: 20px 0; }
          .login-service-grid { margin-top: 20px; }
          .login-service-card { padding: 14px; }
          .login-service-card h3 { margin-top: 8px; }
          .login-access { padding-top: 16px; }
          .login-main { padding-top: 16px; padding-bottom: 16px; }
          .login-form-content { padding-top: 20px; padding-bottom: 20px; }
        }
        @media (min-width: 1024px) and (max-height: 800px) {
          .login-overview { margin: 12px 0; }
          .login-overview h2 { font-size: 30px; margin-top: 10px; }
          .login-overview > p { margin-top: 10px; }
          .login-service-grid { gap: 10px; margin-top: 14px; }
          .login-service-card { padding: 10px 12px; }
          .login-service-card p { line-height: 18px; }
          .login-overview > a { margin-top: 10px; }
          .login-intro { margin-bottom: 18px; }
          .login-intro > span { width: 36px; height: 36px; }
          .login-intro > p { margin-top: 10px; }
          .login-intro h1 { margin-top: 8px; font-size: 30px; }
          .login-form-content { padding: 12px 0; }
          .login-form-content > p { margin-top: 12px; }
        }
        @media (min-width: 1024px) and (max-height: 740px) {
          .login-services { padding-top: 16px; padding-bottom: 16px; }
          .login-service-card p { font-size: 11px; line-height: 16px; }
          .login-service-card h3 { margin-top: 6px; }
          .login-access { padding-top: 10px; font-size: 12px; line-height: 18px; }
          .login-overview > p { line-height: 20px; }
          .login-intro > span { display: none; }
          .login-intro { margin-bottom: 14px; }
          .login-main { padding-top: 10px; padding-bottom: 10px; }
        }
      `}</style>
      <aside aria-labelledby="login-workflow-title" className="login-services relative hidden flex-col justify-between overflow-hidden bg-[#f0f7f7] px-10 py-10 text-slate-950 lg:flex xl:px-16">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-48 h-[600px] w-[600px] rounded-full border border-teal-900/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-28 h-[400px] w-[400px] rounded-full border border-teal-900/5" />
        <Link href="/" className="relative inline-flex w-fit items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100"><Building2 aria-hidden="true" className="h-6 w-6 text-teal-700" /></span>
          <span className="text-xl font-semibold tracking-tight">EstateDesk</span>
        </Link>

        <div className="login-overview relative my-9 w-full max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Property management, connected</p>
          <h2 id="login-workflow-title" className="mt-4 text-3xl font-semibold leading-[1.15] tracking-[-0.035em] xl:text-4xl">Your property operations.<br /><span className="text-teal-700">Working together.</span></h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">From the first lease to the monthly owner statement, manage the work behind every property in one connected workspace.</p>
          <div className="login-service-grid mt-7 grid grid-cols-2 gap-3">
            {services.map(({ icon: Icon, title, description, background, border, ink }) => (
              <article key={title} className="login-service-card rounded-xl border p-4" style={{ backgroundColor: background, borderColor: border }}>
                <Icon aria-hidden="true" className="h-5 w-5" style={{ color: ink }} />
                <h3 className="mt-3 text-sm font-semibold leading-5">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
          <Link href="/services" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-teal-700 hover:text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">Explore all services<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>

        <div className="login-access relative flex items-start gap-3 border-t border-teal-900/15 pt-6 text-sm leading-6 text-slate-600">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
          <p>One workspace for your team.<br /><span className="text-slate-800">Access tailored to each person’s role.</span></p>
        </div>
      </aside>

      <main id="main-content" className="login-main flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-slate-600 transition hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /><span className="hidden sm:inline">Back to EstateDesk</span><span className="sm:hidden">EstateDesk</span>
          </Link>
          <Link href="/services" className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">Explore the platform<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </header>

        <div className="login-form-content mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="login-intro mb-7">
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
