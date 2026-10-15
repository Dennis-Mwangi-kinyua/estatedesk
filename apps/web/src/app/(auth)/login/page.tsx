import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import styles from "./login.module.css";
import { ArrowRight, Building2, ClipboardCheck, ShieldCheck, WalletCards, Droplets, UsersRound, FileText } from "lucide-react";
import { publicPageMetadata } from "@/lib/seo";
import { loginAction } from "./actions";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import LoginForm from "./LoginForm";

export const metadata: Metadata = publicPageMetadata({
  title: "Sign in to EstateDesk",
  description: "Sign in to manage properties, leases, rent payments, maintenance, and your team in one connected EstateDesk workspace.",
  path: "/login",
});

const services = [
  { icon: Building2, title: "Properties & tenancies", tone: "blue", description: "Organise properties, units, tenants, and leases in one place." },
  { icon: WalletCards, title: "Rent & payments", tone: "green", description: "Track invoices, collections, balances, and payment reconciliation." },
  { icon: Droplets, title: "Water billing", tone: "sky", description: "Record meter readings and manage tenant water bills." },
  { icon: ClipboardCheck, title: "Inspections & maintenance", tone: "amber", description: "Document property checks, report issues, and follow up on repairs." },
  { icon: UsersRound, title: "Staff & access", tone: "teal", description: "Coordinate your team with permissions suited to each role." },
  { icon: FileText, title: "Records & reporting", tone: "orange", description: "Keep documents, financial reports, and owner statements accessible." },
];

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params?.returnTo) ?? undefined;

  return (
    <div className={styles.page} data-login-page>
      <PublicAccessHeader />
      <div className={styles.columns}>
      <aside aria-labelledby="login-workflow-title" className={styles.services}>
        <div className={styles.overview}>
          <p className={styles.eyebrow}>Property management, connected</p>
          <h2 id="login-workflow-title">Your property operations.<br /><span>Working together.</span></h2>
          <p className={styles.description}>From the first lease to the monthly owner statement, manage the work behind every property in one connected workspace.</p>
          <div className={styles.serviceGrid}>
            {services.map(({ icon: Icon, title, description, tone }) => (
              <article key={title} className={styles.serviceCard} style={{
                "--service-bg": `var(--login-${tone}-bg)`,
                "--service-edge": `var(--login-${tone}-edge)`,
                "--service-ink": `var(--login-${tone}-ink)`,
              } as CSSProperties}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <Link href="/services" className={styles.explore}>Explore all services<ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className={styles.access}>
          <ShieldCheck aria-hidden="true" />
          <p>One workspace for your team.<br />Access tailored to each person’s role.</p>
        </div>
      </aside>
      <main className={styles.main}>
        <div className={styles.formContent}>
          <div className={styles.intro}>
            <span className={styles.brandIcon}><Building2 aria-hidden="true" /></span>
            <p className={styles.eyebrow}>Your EstateDesk workspace</p>
            <h1 data-heading-icon="custom">Welcome back</h1>
            <p>Sign in to stay on top of your properties, payments, and the work that needs your attention.</p>
          </div>
          <section aria-label="Sign in" className={styles.formCard}>
            <LoginForm returnTo={returnTo} loginAction={loginAction} />
          </section>
          <p className={styles.caption}>For managers, landlords, tenants, and caretakers.<br />Use the account provided by your organisation or property manager.</p>
          <div className={styles.mobileSummary}>
            <p>Your property operations, connected.</p>
            <p>Tenancies & leases · Rent & water billing · Maintenance & inspections</p>
          </div>
        </div>
      </main>
      </div>
      <PublicAccessFooter compact />
    </div>
  );
}
