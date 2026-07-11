import { redirect } from "next/navigation";
import { requireOrgMembership } from "@/lib/permissions/guards";
import {
  formatBillingAmount,
  getSubscriptionAccessState,
} from "@/lib/billing/subscription-access";
import { logoutAction } from "@/features/auth/actions/logout-action";

export default async function BillingRequiredPage() {
  const session = await requireOrgMembership();
  const access = await getSubscriptionAccessState(session.activeOrgId!);

  if (access.status !== "blocked") {
    redirect("/dashboard");
  }

  return (
    <div className="ed-theme-page flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <section className="ios-panel w-full max-w-xl rounded-[30px] p-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Billing required
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">
          Your trial and grace period have expired
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          You can sign in, but system access is locked until your organization
          pays{" "}
          <span className="font-semibold text-neutral-950">
            {formatBillingAmount(access.amountDue)}
          </span>{" "}
          for the {access.plan} plan.
        </p>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white/80 p-4 text-left text-sm text-neutral-600">
          <p>
            Pay the outstanding subscription fee, then ask a platform operator to
            activate your plan. Organizations cannot self-assign paid plans.
          </p>
          <p className="mt-2">
            Trial ended: {access.trialEndsAt?.toLocaleDateString("en-KE") ?? "—"}
          </p>
          <p>
            Grace ended: {access.graceEndsAt?.toLocaleDateString("en-KE") ?? "—"}
          </p>
          <p className="mt-2">
            Admins can open{" "}
            <a
              href="/dashboard/org/settings#billing"
              className="font-semibold text-neutral-950 underline underline-offset-2"
            >
              Settings → Billing
            </a>{" "}
            to submit an upgrade request after payment.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href="/contact"
            className="ios-button inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-950"
          >
            Contact support
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="ios-button inline-flex h-11 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white sm:w-auto"
            >
              Logout
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
