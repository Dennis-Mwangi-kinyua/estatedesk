"use client";

import { useState, useTransition } from "react";
import { Gift, Sparkles } from "lucide-react";
import type { RentRewardsSnapshot } from "@/lib/rewards/rent-rewards";
import type { RedeemableReward } from "@/lib/rewards/redeem";
import { requestTenantRewardAction } from "../actions";

export function TenantRewardsWorkspace({
  tenantId,
  tenantName,
  snapshot,
  availablePoints,
  redeemedPoints,
  catalog,
  redemptions,
}: {
  tenantId: string;
  tenantName: string;
  snapshot: RentRewardsSnapshot;
  availablePoints: number;
  redeemedPoints: number;
  catalog: RedeemableReward[];
  redemptions: Array<{
    id: string;
    label: string;
    pointsCost: number;
    status: string;
    category: string;
    createdAt: Date | string;
    fulfilledAt: Date | string | null;
  }>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function redeem(rewardId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("tenantId", tenantId);
      formData.set("rewardId", rewardId);
      const result = await requestTenantRewardAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="ed-mobile-first mx-auto w-full max-w-4xl space-y-4 px-3 pb-10 pt-3 sm:space-y-6 sm:px-6">
      <header className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Gift className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              RentRewards
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Your loyalty rewards
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hi {tenantName} — earn points for early and on-time payments, then
              redeem data, shopping, or insurance vouchers.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            ["Available", String(availablePoints)],
            ["Earned", String(snapshot.points)],
            ["Redeemed", String(redeemedPoints)],
            ["Tier", snapshot.tier],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-muted/15 px-3 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
            <Sparkles className="h-3 w-3 text-primary" />
            Streak {snapshot.streakMonths} mo
          </span>
          <span className="rounded-full border border-border bg-background px-2.5 py-1">
            Early {snapshot.earlyPayments} · On-time {snapshot.onTimePayments}
          </span>
          {snapshot.nextTier ? (
            <span className="rounded-full border border-border bg-background px-2.5 py-1">
              {snapshot.pointsToNextTier} pts to {snapshot.nextTier}
            </span>
          ) : null}
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-foreground">Redeem</h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Requests go to your property office for voucher fulfillment.
        </p>
        <ul className="mt-4 space-y-2">
          {catalog.map((item) => {
            const canAfford = availablePoints >= item.pointsCost;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/10 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs font-medium text-foreground">
                    {item.pointsCost} points · {item.category}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canAfford || isPending}
                  onClick={() => redeem(item.id)}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {canAfford ? "Request redeem" : "Need more pts"}
                </button>
              </li>
            );
          })}
        </ul>
        {message ? (
          <p className="mt-3 text-xs text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-foreground">
          Your redemptions
        </h2>
        {redemptions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            No redemptions yet. Pay early to build points.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
            {redemptions.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 px-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.pointsCost} pts · {row.category} ·{" "}
                    {new Date(row.createdAt).toLocaleDateString("en-KE")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
