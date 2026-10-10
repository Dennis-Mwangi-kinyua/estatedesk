import { DeferredLink } from "@/components/navigation/app-links";

type OrgDashboardFooterProps = {
  organizationName: string;
};

export function OrgDashboardFooter({
  organizationName,
}: OrgDashboardFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[85] border-t border-white/60 bg-white/78 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/78 lg:left-72">
      <div className="flex min-h-10 items-center justify-between gap-3 py-2 px-4 sm:px-6 lg:px-8">
        <p className="ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-[11px] text-neutral-500 dark:text-neutral-400">
          © {new Date().getFullYear()} {organizationName}
        </p>

        <nav aria-label="Footer navigation" className="flex items-center gap-1">
          <DeferredLink data-workspace-action="true"
            href="/dashboard/org/settings"
            className="inline-flex h-7 items-center justify-center rounded-full px-2.5 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Settings
          </DeferredLink>
          <DeferredLink data-workspace-action="true"
            href="/reports"
            className="inline-flex h-7 items-center justify-center rounded-full px-2.5 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Reports
          </DeferredLink>
          <DeferredLink data-workspace-action="true"
            href="/notifications"
            className="inline-flex h-7 items-center justify-center rounded-full px-2.5 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Alerts
          </DeferredLink>
        </nav>
      </div>
    </footer>
  );
}
