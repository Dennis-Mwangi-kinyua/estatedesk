import Link from "next/link";

export const metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">EstateDesk</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-normal">You are offline</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          EstateDesk could not reach the network. Reconnect and try again to load the latest
          dashboard, tenant, payment, or vacancy data.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Try EstateDesk again
        </Link>
      </section>
    </main>
  );
}
