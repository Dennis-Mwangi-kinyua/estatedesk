import Link from "next/link";
import { resetPasswordAction } from "@/app/(auth)/reset-password/actions";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    status?: string;
  }>;
};

function getFeedback(status?: string) {
  switch (status) {
    case "invalid":
      return {
        tone: "error" as const,
        title: "Invalid link",
        message: "This password reset link is invalid or has already been used.",
      };
    case "expired":
      return {
        tone: "error" as const,
        title: "Link expired",
        message: "This password reset link has expired. Request a new one.",
      };
    case "password_mismatch":
      return {
        tone: "error" as const,
        title: "Passwords do not match",
        message: "Please make sure both password fields match.",
      };
    case "weak_password":
      return {
        tone: "error" as const,
        title: "Weak password",
        message: "Your password must be at least 8 characters long.",
      };
    case "missing_token":
      return {
        tone: "error" as const,
        title: "Missing token",
        message: "Open the reset link from your email to continue.",
      };
    case "success":
      return {
        tone: "success" as const,
        title: "Password updated",
        message: "Your password has been reset successfully. You can now sign in.",
      };
    default:
      return null;
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, status } = await searchParams;
  const feedback = getFeedback(status);

  const hasToken = typeof token === "string" && token.trim().length > 0;
  const canShowForm = hasToken && status !== "success";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        {feedback ? (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              feedback.tone === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <p className="font-medium">{feedback.title}</p>
            <p className="mt-1">{feedback.message}</p>
          </div>
        ) : null}

        {canShowForm ? (
          <form action={resetPasswordAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Enter new password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Update Password
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <Link
              href="/forgot-password"
              className="block w-full rounded-lg bg-black py-3 text-center text-sm font-medium text-white hover:opacity-90"
            >
              Request New Reset Link
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-700 underline hover:text-black"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}