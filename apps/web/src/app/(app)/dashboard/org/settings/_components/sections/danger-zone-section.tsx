import { ArrowUpRight } from "lucide-react";
import { SectionCard } from "../../settings-ui";

export function DangerZoneSection() {
  return (
    <SectionCard
      id="danger-zone"
      hidden
      title="Danger Zone"
      description="Sensitive organization-level actions. Leave these disabled until you define the exact policy."
    >
      <div className="space-y-3">
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left opacity-60 dark:border-white/10 dark:bg-slate-900"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Suspend Organization
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add a dedicated admin-only action before enabling this.
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </button>

        <button
          type="button"
          disabled
          className="flex w-full items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left opacity-60 dark:border-white/10 dark:bg-slate-900"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Disable Organization
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add a dedicated admin-only action before enabling this.
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>
    </SectionCard>
  );
}