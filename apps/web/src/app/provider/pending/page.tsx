import Link from "next/link";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ActionForm, Field, ProfileFields, panelClass } from "@/features/providers/forms";
import { resubmitProviderApplication } from "@/features/providers/actions";

export const dynamic = "force-dynamic";

export default async function ProviderPendingPage() {
  const session = await requireUserSession();
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId: session.userId },
    select: { status: true, reviewFeedback: true, nationalId: true, businessName: true, category: true, location: true, bio: true, portfolioUrl: true, available: true, user: { select: { email: true, emailVerified: true } } },
  });

  if (!provider) {
    return (
      <main className="mx-auto max-w-xl space-y-4 px-4 py-16">
        <h1 className="text-2xl font-bold">No provider application found</h1>
        <p className="text-muted-foreground">Create a provider profile to apply for provider access.</p>
        <Link className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground" href="/service-providers/register">
          Create provider profile
        </Link>
      </main>
    );
  }

  if (provider.status === "CHANGES_REQUESTED") {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:py-16">
        <header className={`${panelClass} border-amber-500/30`}>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Application update</p>
          <h1 className="mt-2 text-3xl font-bold">A few corrections are needed</h1>
          <p className="mt-2 text-muted-foreground">Update the details below and resubmit your application. Your profile remains private while it is reviewed.</p>
          {provider.reviewFeedback ? <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><h2 className="font-semibold">Feedback from EstateDesk</h2><p className="mt-2 whitespace-pre-line text-sm">{provider.reviewFeedback}</p></div> : null}
        </header>
        <section className={panelClass}>
          <h2 className="mb-4 text-xl font-semibold">Update provider details</h2>
          <ActionForm action={resubmitProviderApplication} label="Resubmit for review">
            <Field name="nationalId" label="National ID number (private)" value={provider.nationalId ?? ""} maxLength={40} />
            <ProfileFields profile={provider} />
          </ActionForm>
        </section>
      </main>
    );
  }

  if (provider.status === "REJECTED") {
    return (
      <main className="mx-auto max-w-xl space-y-5 px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-destructive">Application decision</p>
        <h1 className="text-3xl font-bold">Your application was declined</h1>
        {provider.reviewFeedback ? <p className="rounded-xl border border-border bg-card p-4 whitespace-pre-line">{provider.reviewFeedback}</p> : null}
        <p className="text-muted-foreground">Contact EstateDesk support if you believe this decision was made in error.</p>
        <Link className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 font-semibold" href="/service-providers">Back to service providers</Link>
      </main>
    );
  }

  if (provider.status !== "PENDING") {
    return (
      <main className="mx-auto max-w-xl space-y-4 px-4 py-16">
        <h1 className="text-2xl font-bold">Provider account unavailable</h1>
        <p className="text-muted-foreground">Your provider access is not currently active. Contact EstateDesk support if you need help.</p>
        <Link className="text-primary underline" href="/provider">Open provider portal</Link>
      </main>
    );
  }

  const verified = Boolean(provider.user.emailVerified);

  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Provider application</p>
      <h1 className="text-3xl font-bold">{verified ? "Awaiting platform approval" : "Verify your email to continue"}</h1>
      <p className="text-muted-foreground">
        {verified
          ? "Your email is verified. A platform administrator will review your profile. We’ll email you when the account is approved and ready to sign in."
          : `Open the verification link sent to ${provider.user.email ?? "your email address"}. A platform administrator can review your application after verification.`}
      </p>
      {!verified && provider.user.email ? (
        <p className="text-sm text-muted-foreground">
          Didn’t receive the message?{" "}
          <Link className="font-semibold text-primary underline underline-offset-4" href={`/verify-email?email=${encodeURIComponent(provider.user.email)}`}>
            Resend the verification email
          </Link>
          .
        </p>
      ) : null}
      <Link className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 font-semibold" href="/service-providers">
        Back to service providers
      </Link>
    </main>
  );
}
