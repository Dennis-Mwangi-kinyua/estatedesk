import Link from "next/link";

type OrgDashboardFooterProps = {
  organizationName: string;
};

export function OrgDashboardFooter({
  organizationName,
}: OrgDashboardFooterProps) {
  return (
    <footer className="border-t border-black/10 bg-white px-4 py-4 text-sm text-neutral-500 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {organizationName}. All rights reserved.
        </p>

        <div className="flex gap-4">
          <Link href="/settings" className="hover:text-neutral-900">
            Settings
          </Link>
          <Link href="/reports" className="hover:text-neutral-900">
            Reports
          </Link>
          <Link href="/support" className="hover:text-neutral-900">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}