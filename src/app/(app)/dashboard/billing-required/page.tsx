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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] p-4">
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
            Contact the platform administrator to confirm payment or update your
            subscription.
          </p>
          <p className="mt-2">
            Trial ended: {access.trialEndsAt?.toLocaleDateString("en-KE") ?? "—"}
          </p>
          <p>
            Grace ended: {access.graceEndsAt?.toLocaleDateString("en-KE") ?? "—"}
          </p>
        </div>

        <form action={logoutAction} className="mt-5">
          <button
            type="submit"
            className="ios-button inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white"
          >
            Logout
          </button>
        </form>
      </section>
    </div>
  );
}
