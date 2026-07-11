"use client";

import { useState, useTransition } from "react";
import {
  fulfillRentRewardAction,
  redeemRentRewardAction,
} from "../_lib/reward-actions";

type RewardOption = {
  id: string;
  label: string;
  pointsCost: number;
  category: string;
};

type PendingRedemption = {
  id: string;
  label: string;
  pointsCost: number;
  status: string;
};

export function RentRewardsRedeem({
  tenantId,
  rewards,
  pending = [],
}: {
  tenantId: string;
  rewards: RewardOption[];
  pending?: PendingRedemption[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function redeem(rewardId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("tenantId", tenantId);
      formData.set("rewardId", rewardId);
      const result = await redeemRentRewardAction(formData);
      setMessage(result.message);
    });
  }

  function fulfill(redemptionId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("tenantId", tenantId);
      formData.set("redemptionId", redemptionId);
      const result = await fulfillRentRewardAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="mt-4 space-y-3">
      {rewards.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Redeem catalog
          </p>
          {rewards.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.pointsCost} pts · {item.category}
                </p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => redeem(item.id)}
                className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-60"
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Keep paying on time to unlock data bundles and shopping tokens.
        </p>
      )}

      {pending.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pending fulfillment
          </p>
          {pending.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/10 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {row.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {row.pointsCost} pts · {row.status}
                </p>
              </div>
              {row.status === "PENDING" ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fulfill(row.id)}
                  className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground disabled:opacity-60"
                >
                  Mark fulfilled
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
