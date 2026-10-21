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

  return (
    <ErrorState
      title="Platform page could not load"
      description="The server failed while building this page. The reference below helps an administrator or developer find the matching error in the server logs; it does not explain or fix the problem by itself."
      reference={error.digest}
      supportInstructions="Try again once. If it still fails, copy the reference and send it with the page URL and the time it happened to your platform developer. The developer should search the production server or hosting logs for this reference and timestamp, inspect the underlying exception and stack trace, fix the failing server component or data dependency, then deploy the fix. The detailed error is kept in server logs so private data is not exposed in the browser."
      retry={reset}
      homeHref="/platform"
      homeLabel="Platform home"
    />
  );
}
