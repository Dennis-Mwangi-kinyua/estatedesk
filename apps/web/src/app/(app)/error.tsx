"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { reportClientError } from "@/lib/errors/report-client-error";

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportClientError({ context: "workspace-page", digest: error.digest }); }, [error]);
  return <ErrorState reference={error.digest} retry={reset} homeHref="/dashboard" />;
}
