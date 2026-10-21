import type { Metadata } from "next";
import Link from "next/link";
import { getUserSession } from "@/lib/auth/session";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { ActionForm, Field, ProfileFields, panelClass } from "@/features/providers/forms";
import { registerProvider } from "@/features/providers/actions";

export const metadata: Metadata = {
  title: "Create a service provider account | EstateDesk",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const session = await getUserSession();

  return (
    <>
      <PublicAccessHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <section className="space-y-5 lg:sticky lg:top-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                EstateDesk service providers
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create your provider account
              </h1>
              <p className="text-muted-foreground">
                Build a public business profile, showcase completed work, and
                receive job opportunities from property organisations.
              </p>
            </div>

            <ol className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
              <li><span className="font-semibold">1. Create your login</span><p className="mt-1 text-muted-foreground">Choose a username and password, then verify your email address.</p></li>
              <li><span className="font-semibold">2. Submit your provider profile</span><p className="mt-1 text-muted-foreground">Share your services, area served, and portfolio details for review.</p></li>
              <li><span className="font-semibold">3. Wait for approval</span><p className="mt-1 text-muted-foreground">We’ll email you when your account is approved and ready to sign in.</p></li>
            </ol>

            <p className="text-sm text-muted-foreground">
              After approval, sign in through the regular EstateDesk login with
              your username or email and the password you create here. You do
              not need a tenant or organisation role.
            </p>
          </section>

          <section className={panelClass}>
            <h2 className="text-xl font-semibold">
              {session ? "Complete your provider profile" : "Account and business details"}
            </h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">
              {session
                ? `This profile will be linked to your signed-in account (${session.fullName}).`
                : "Your email and password are private. Your business profile and portfolio are public."}
            </p>

            <ActionForm
              action={registerProvider}
              label={session ? "Create provider profile" : "Create provider account"}
            >
              {!session ? (
                <>
                  <Field name="fullName" label="Full name" autoComplete="name" />
                  <Field name="username" label="Username" maxLength={30} autoComplete="username" />
                  <p className="-mt-2 text-xs text-muted-foreground">Use 3–30 letters, numbers, dots, underscores, or hyphens.</p>
                  <Field name="email" label="Email address" type="email" maxLength={254} autoComplete="email" />
                  <Field name="password" label="Password (at least 12 characters)" type="password" maxLength={72} />
                  <p className="text-sm text-muted-foreground">
                    Already have an EstateDesk account?{" "}
                    <Link
                      className="font-semibold text-primary underline underline-offset-4"
                      href="/login?returnTo=%2Fservice-providers%2Fregister"
                    >
                      Sign in and continue
                    </Link>
                    .
                  </p>
                </>
              ) : null}

              <Field name="nationalId" label="National ID number (private)" maxLength={40} />
              <ProfileFields />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="acceptedTerms" required className="mt-1" />
                <span>
                  I accept the <Link href="/terms" className="underline">terms of use</Link> and understand
                  that my business profile and portfolio are public.
                </span>
              </label>
            </ActionForm>
          </section>
        </div>
      </main>
      <PublicAccessFooter />
    </>
  );
}
