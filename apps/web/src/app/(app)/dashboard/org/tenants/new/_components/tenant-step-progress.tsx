import { stepItems } from "../_lib/constants";
import type { Step } from "../_lib/types";
import { StepChip } from "./step-chip";

export function TenantStepProgress({ step }: { step: Step }) {
  return (
    <div className="border-b border-border bg-muted/10 px-4 py-4 sm:px-6">
      <ol aria-label="Tenant setup steps" className="grid grid-cols-5 gap-1 sm:gap-2">
        {stepItems.map((item) => (
          <StepChip key={item.id} item={item} active={step === item.id} complete={step > item.id} />
        ))}
      </ol>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Tenant setup progress" aria-valuemin={1} aria-valuemax={5} aria-valuenow={step}>
        <div className="h-full rounded-full bg-primary transition-all duration-300 motion-reduce:transition-none" style={{ width: `${step * 20}%` }} />
      </div>
    </div>
  );
}
