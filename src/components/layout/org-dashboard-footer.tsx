import Link from "next/link";

type OrgDashboardFooterProps = {
  organizationName: string;
};

export function OrgDashboardFooter({
  organizationName,
}: OrgDashboardFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[85] border-t border-black/10 bg-white/95 backdrop-blur-md lg:left-72">
      <div className="flex h-10 items-center justify-between px-4 sm:px-6 lg:px-8">
        <p className="truncate text-[11px] text-neutral-500">
          © {new Date().getFullYear()} {organizationName}
        </p>

        <nav aria-label="Footer navigation" className="flex items-center gap-1">
          <Link
            href="/dashboard/org/settings"
            className="inline-flex h-7 items-center justify-center rounded-full px-2.5 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            Settings
          </Link>
          <Link
            href="/reports"
            className="inline-flex h-7 items-center justify-center rounded-full px-2.5 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            Reports
          </Link>
          <Link
            href="/notifications"
            className="inline-flex h-7 items-center justify-center rounded-full px-2.5 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            Alerts
          </Link>
        </nav>
      </div>
    </footer>
  );
}