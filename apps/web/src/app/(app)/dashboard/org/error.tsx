"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { reportClientError } from "@/lib/errors/report-client-error";

export default function OrgDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      context: "org-dashboard",
      digest: error.digest,
    });
  }, [error]);

  return <ErrorState title="Organization dashboard could not load" reference={error.digest} retry={reset} homeHref="/dashboard/org" homeLabel="Dashboard home" />;
}
