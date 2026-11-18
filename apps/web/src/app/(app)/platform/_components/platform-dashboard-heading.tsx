import type { CSSProperties } from "react";
import { workspaceHeadingIcon } from "@/components/shared/workspace-heading-icons";

export function PlatformDashboardHeading() {
  const icon = workspaceHeadingIcon("/platform");
  return <div className="min-w-0 flex-1">
    <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      EstateDesk · Platform administration
    </p>
    <h1 data-heading-icon="custom" data-workspace-heading-icon={icon.name}
      style={{ "--workspace-heading-icon": icon.mask, "--workspace-heading-image": icon.image } as CSSProperties}
      className="mt-3 w-full text-[clamp(1.35rem,3.2vw,2.25rem)] font-semibold leading-[1.15] tracking-[-0.035em]">Platform overview</h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Monitor organizations, revenue and platform activity. Review requests that need attention.</p>
  </div>;
}
