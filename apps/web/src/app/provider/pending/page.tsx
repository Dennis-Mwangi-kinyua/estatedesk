import Link from "next/link";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProviderPendingPage() {
  const session = await requireUserSession();
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId: session.userId },
    select: { status: true, user: { select: { email: true, emailVerified: true } } },
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

  if (provider.status !== "PENDING") {
    return (
      <main className="mx-auto max-w-xl space-y-4 px-4 py-16">
        <h1 className="text-2xl font-bold">Provider account unavailable</h1>
        <p className="text-muted-foreground">Your provider access is not currently active. Contact EstateDesk support if you need help.</p>
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
