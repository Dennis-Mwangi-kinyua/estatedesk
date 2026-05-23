import Link from "next/link";
import { forgotPasswordAction } from "@/app/(auth)/forgot-password/actions";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

function getStatusMessage(status?: string) {
  switch (status) {
    case "sent":
      return {
        type: "success" as const,
        text: "If an account exists for that email, a password reset link has been sent.",
      };
    case "invalid_email":
      return {
        type: "error" as const,
        text: "Please enter a valid email address.",
      };
    default:
      return null;
  }
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { status } = await searchParams;
  const feedback = getStatusMessage(status);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a password reset
            link.
          </p>
        </div>

        <form action={forgotPasswordAction} className="space-y-4">
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
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {feedback ? (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.text}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Send Reset Link
          </button>
        </form>

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