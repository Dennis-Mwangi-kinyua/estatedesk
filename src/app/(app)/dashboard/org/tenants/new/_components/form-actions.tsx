"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { buttonPrimaryClassName, buttonSecondaryClassName } from "../_lib/constants";
import type { Step } from "../_lib/types";

export function FormActionsDesktop({
  step,
  isPending,
  onBack,
  onNext,
}: {
  step: Step;
  isPending: boolean;
  onBack: () => void;
  onNext: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="hidden border-t border-border pt-6 sm:block">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">Step {step} of 4</div>

        <div className="flex gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isPending}
              className={buttonSecondaryClassName}
            >
              Back
            </button>
          ) : (
            <Link href="/dashboard/org/tenants" className={buttonSecondaryClassName}>
              Cancel
            </Link>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={onNext}
              disabled={isPending}
              className={buttonPrimaryClassName}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className={buttonPrimaryClassName}
            >
              {isPending ? "Creating tenant..." : "Save tenant and create account"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FormActionsMobile({
  step,
  isPending,
  onBack,
  onNext,
}: {
  step: Step;
  isPending: boolean;
  onBack: () => void;
  onNext: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="border-t border-border pt-4 sm:hidden">
      <div className="space-y-3">
        <div className="text-center text-sm text-muted-foreground">Step {step} of 4</div>

        <div className="grid grid-cols-2 gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isPending}
              className={buttonSecondaryClassName}
            >
              Back
            </button>
          ) : (
            <Link href="/dashboard/org/tenants" className={buttonSecondaryClassName}>
              Cancel
            </Link>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={onNext}
              disabled={isPending}
              className={buttonPrimaryClassName}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className={buttonPrimaryClassName}
            >
              {isPending ? "Creating..." : "Save tenant"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}