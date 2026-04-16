import Link from "next/link";
import {
  resendVerificationEmailAction,
  verifyEmailAction,
} from "@/app/(auth)/verify-email/actions";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string;
    status?: string;
    email?: string;
  }>;
};

function getFeedback(status?: string) {
  switch (status) {
    case "verified":
      return {
        tone: "success" as const,
        title: "Email verified",
        message: "Your email has been verified successfully. You can now sign in.",
      };
    case "already_verified":
      return {
        tone: "success" as const,
        title: "Already verified",
        message: "This email address was already verified. You can sign in normally.",
      };
    case "sent":
      return {
        tone: "success" as const,
        title: "Verification email sent",
        message: "We sent a new verification link to your email address.",
      };
    case "expired":
      return {
        tone: "error" as const,
        title: "Link expired",
        message: "That verification link has expired. Request a new one below.",
      };
    case "invalid":
      return {
        tone: "error" as const,
        title: "Invalid link",
        message: "That verification link is invalid or has already been used.",
      };
    case "missing_email":
      return {
        tone: "error" as const,
        title: "Email required",
        message: "Please enter your email address to resend the verification link.",
      };
    case "invalid_email":
      return {
        tone: "error" as const,
        title: "Invalid email",
        message: "Please enter a valid email address.",
      };
    default:
      return null;
  }
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token, status, email } = await searchParams;
  const feedback = getFeedback(status);

  const hasToken = typeof token === "string" && token.trim().length > 0;
  const showVerifyForm =
    hasToken && status !== "verified" && status !== "already_verified";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {showVerifyForm ? "Verify Your Email" : "Email Verification"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {showVerifyForm
              ? "Click below to confirm your email address."
              : "Use the verification link from your email, or request a new one."}
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

        {showVerifyForm ? (
          <form action={verifyEmailAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            <button
              type="submit"
              className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Verify Email
            </button>
          </form>
        ) : (
          <form action={resendVerificationEmailAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={email ?? ""}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Resend Verification Email
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-col gap-3 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-700 underline hover:text-black"
          >
            Back to Login
          </Link>

          <Link
            href="/forgot-password"
            className="text-sm text-gray-500 underline hover:text-black"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}