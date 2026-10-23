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
          <section className="space-y-6 lg:sticky lg:top-8">
            <div className="space-y-3">
              <p className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">EstateDesk marketplace</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create your provider account
              </h1>
              <p className="text-muted-foreground">
                Put your work in front of property organisations. Build a credible business profile, show examples of completed work, and respond to relevant job opportunities.
              </p>
            </div>

            <ol className="space-y-0 overflow-hidden rounded-2xl border border-border bg-card text-sm">
              <li className="flex gap-4 border-b border-border p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">1</span><div><span className="font-semibold">Create your login</span><p className="mt-1 text-muted-foreground">Use your own username and password, then verify your email.</p></div></li>
              <li className="flex gap-4 border-b border-border p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">2</span><div><span className="font-semibold">Build your business profile</span><p className="mt-1 text-muted-foreground">Describe your services, coverage area, and relevant experience. Add project examples to build trust.</p></div></li>
              <li className="flex gap-4 p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">3</span><div><span className="font-semibold">Complete platform review</span><p className="mt-1 text-muted-foreground">The EstateDesk team reviews your application and emails you when a decision is made.</p></div></li>
            </ol>

            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-semibold">You’ll use the regular EstateDesk login</p>
              <p className="mt-1 text-muted-foreground">
              After approval, sign in through the regular EstateDesk login with
              your username or email and the password you create here. You do
              not need a tenant or organisation role.
              </p>
            </div>
          </section>

          <section className={`${panelClass} sm:p-7`}>
            <div className="mb-6 border-b border-border pb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Application form</p>
              <h2 className="mt-1 text-2xl font-bold">
                {session ? "Complete your provider profile" : "Account and business details"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
              {session
                ? `This profile will be linked to your signed-in account (${session.fullName}).`
                : "Your email and password are private. Your business profile and portfolio are public."}
              </p>
            </div>

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

              <div className="space-y-3 rounded-xl border border-border p-4">
                <div><h3 className="font-semibold">Identity details</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Your National ID is private and not shown on your public profile. EstateDesk uses it to reduce duplicate provider accounts; ID numbers are masked in review screens.</p></div>
                <Field name="nationalId" label="National ID number" maxLength={40} />
              </div>
              <div className="space-y-3 rounded-xl border border-border p-4">
                <div><h3 className="font-semibold">Public business profile</h3><p className="mt-1 text-xs text-muted-foreground">Organisations can see these details after your profile is approved.</p></div>
                <ProfileFields />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="acceptedTerms" required className="mt-1" />
                <span>
                  I accept the <Link href="/terms" className="underline">terms of use</Link> and understand that my business profile and portfolio are public after approval. My login credentials and National ID are private.
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
