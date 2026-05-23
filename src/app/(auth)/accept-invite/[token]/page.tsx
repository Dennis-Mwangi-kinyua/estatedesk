"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type InviteStatus = "idle" | "loading" | "success" | "error";

type AcceptInviteResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  redirectTo?: string;
  organizationId?: string;
};

const ACCEPT_INVITE_ENDPOINT = "/api/auth/accept-invite";

function getParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function readJson(response: Response): Promise<AcceptInviteResponse> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return {};
  }

  return (await response.json()) as AcceptInviteResponse;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong while accepting the invite.";
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams<{ token?: string | string[] }>();

  const token = useMemo(() => {
    return decodeURIComponent(getParamValue(params.token));
  }, [params.token]);

  const [status, setStatus] = useState<InviteStatus>("idle");
  const [message, setMessage] = useState<string>(
    "Preparing your invitation..."
  );
  const [redirectTo, setRedirectTo] = useState<string>("/dashboard/org");

  const acceptInvite = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link. The invite token is missing.");
      return;
    }

    setStatus("loading");
    setMessage("Accepting your invitation...");

    try {
      const response = await fetch(ACCEPT_INVITE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "This invitation could not be accepted."
        );
      }

      setStatus("success");
      setMessage(data.message || "Invitation accepted successfully.");
      setRedirectTo(data.redirectTo || "/dashboard/org");
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }, [token]);

  useEffect(() => {
    void acceptInvite();
  }, [acceptInvite]);

  const isLoading = status === "idle" || status === "loading";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            ) : isSuccess ? (
              <span className="text-xl font-semibold text-emerald-600">✓</span>
            ) : (
              <span className="text-xl font-semibold text-red-600">!</span>
            )}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {isLoading && "Accepting invite"}
            {isSuccess && "Invite accepted"}
            {isError && "Invite failed"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Please do not close this page while we verify your invitation.
          </div>
        )}

        {isSuccess && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push(redirectTo)}
              className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Continue to dashboard
            </button>

            <Link
              href="/dashboard/org"
              className="block text-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Go to organization dashboard
            </Link>
          </div>
        )}

        {isError && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void acceptInvite()}
              className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Try again
            </button>

            <Link
              href="/login"
              className="block text-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Back to login
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}