import Link from "next/link";
import { SurfaceCard } from "./issues-page-shell";

export function IssuesEmptyState({
  organizationName,
}: {
  organizationName: string;
}) {
  return (
    <SurfaceCard className="p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f2f7] text-2xl">
        🛠️
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">
        No issues yet
      </h1>

      <p className="mt-2 text-sm leading-6 text-neutral-500">
        There are no issue tickets for {organizationName} right now.
      </p>

      <div className="mt-6">
        <Link
          href="/dashboard/org"
          className="inline-flex items-center rounded-[18px] bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
        >
          Back to dashboard
        </Link>
      </div>
    </SurfaceCard>
  );
}