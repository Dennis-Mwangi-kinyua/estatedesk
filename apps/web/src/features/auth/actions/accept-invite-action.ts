"use server";

import { headers } from "next/headers";
import { safeServerActionError } from "@/lib/errors/server-error-log";

export type AcceptInviteActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  redirectTo?: string;
  organizationId?: string;
};

const ACCEPT_INVITE_ENDPOINT = "/api/auth/accept-invite";

async function getBaseUrl() {
  const requestHeaders = await headers();

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (
        (url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:")) &&
        !url.username && !url.password
      ) return url.origin;
    } catch {
      // Fall through to the fixed production origin or local development host.
    }
  }

  if (process.env.NODE_ENV === "production") return "https://estatedesk.co.ke";

  const host = requestHeaders.get("host")?.toLowerCase() ?? "";
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(host)) {
    return "http://localhost:3000";
  }
  const protocol = requestHeaders.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}

async function readJsonSafely(response: Response): Promise<AcceptInviteActionResult> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return {
      success: response.ok,
      message: response.ok ? "Invitation accepted successfully." : undefined,
      error: response.ok ? undefined : "Failed to accept invitation.",
    };
  }

  return (await response.json()) as AcceptInviteActionResult;
}

export async function acceptInviteAction(
  token: string
): Promise<AcceptInviteActionResult> {
  if (!token || token.trim().length === 0) {
    return {
      success: false,
      error: "Invalid invitation link. The invite token is missing.",
    };
  }

  try {
    const requestHeaders = await headers();
    const cookie = requestHeaders.get("cookie");
    const baseUrl = await getBaseUrl();

    const response = await fetch(`${baseUrl}${ACCEPT_INVITE_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      cache: "no-store",
      body: JSON.stringify({
        token,
      }),
    });

    const data = await readJsonSafely(response);

    if (!response.ok) {
      return {
        success: false,
        error:
          data.error ||
          data.message ||
          "This invitation could not be accepted.",
      };
    }

    return {
      success: true,
      message: data.message || "Invitation accepted successfully.",
      redirectTo: data.redirectTo || "/dashboard/org",
      organizationId: data.organizationId,
    };
  } catch (error) {
    return {
      success: false,
      error: safeServerActionError(
        "acceptInviteAction",
        error,
        "Something went wrong while accepting the invite.",
      ),
    };
  }
}
