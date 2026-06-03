"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Platform route error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-neutral-50 p-4">
      <section className="w-full max-w-lg rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="inline-flex rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Platform page could not load
        </h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600">
          A server-side error occurred while loading this platform page. Try
          again, or use the digest below when checking production logs.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-mono text-neutral-700">
            Digest: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/platform"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800"
          >
            Platform home
          </Link>
        </div>
      </section>
    </div>
  );
}
