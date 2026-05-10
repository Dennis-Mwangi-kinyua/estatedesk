import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] p-4">
      <section className="ios-panel w-full max-w-xl overflow-hidden rounded-[32px] p-6 text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[36px] bg-neutral-950 text-white shadow-xl">
          <div className="relative">
            <ShieldAlert className="h-14 w-14 animate-pulse" />
            <span className="absolute -right-2 -top-2 h-4 w-4 animate-bounce rounded-full bg-amber-300" />
          </div>
        </div>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Access blocked
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
          This area is not available to your account
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
          EstateDesk protects each workspace by role. You can only view pages and
          data assigned to your account.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="ios-button inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white"
          >
            Go to my dashboard
          </Link>
          <Link
            href="/"
            className="ios-button inline-flex h-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-800"
          >
            Back to homepage
          </Link>
        </div>
      </section>
    </div>
  );
}
