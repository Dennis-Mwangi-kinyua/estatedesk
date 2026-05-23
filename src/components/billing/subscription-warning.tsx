import {
  formatBillingAmount,
  type SubscriptionAccessState,
} from "@/lib/billing/subscription-access";

export function SubscriptionWarning({
  access,
}: {
  access: SubscriptionAccessState;
}) {
  if (access.status !== "grace") return null;

  return (
    <div className="mb-4 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
      <p className="font-semibold">Trial expired. Payment is due.</p>
      <p className="mt-1 leading-6">
        Your organization is in a {access.daysLeft}-day grace period. Pay{" "}
        <span className="font-semibold">
          {formatBillingAmount(access.amountDue)}
        </span>{" "}
        for the {access.plan} plan before access is locked.
      </p>
    </div>
  );
}
