"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { reportClientError } from "@/lib/errors/report-client-error";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      context: "platform",
      digest: error.digest,
    });
  }, [error]);

  return <ErrorState title="Platform page could not load" reference={error.digest} retry={reset} homeHref="/platform" homeLabel="Platform home" />;
}
