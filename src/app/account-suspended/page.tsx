import Link from "next/link";
import { Ban, Mail } from "lucide-react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata;

type SuspendedAccountPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function SuspendedAccountPage({
  searchParams,
}: SuspendedAccountPageProps) {
  const params = await searchParams;
  const status = params?.status?.toUpperCase() ?? "SUSPENDED";

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10 text-neutral-950">
      <section className="w-full max-w-lg rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="inline-flex rounded-2xl border border-red-200 bg-red-50 p-3 text-red-700">
          <Ban className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Account {status.toLowerCase()}
        </h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600">
          This account cannot access EstateDesk right now. You cannot perform
          any task until a platform or organization administrator restores your
          access.
        </p>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-950">
            What to do next
          </p>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Contact your administrator or EstateDesk support with the email or
            username you use to sign in.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white"
          >
            <Mail className="h-4 w-4" />
            Contact support
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800"
          >
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
