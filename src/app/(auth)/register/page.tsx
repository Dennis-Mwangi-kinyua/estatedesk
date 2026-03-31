import Link from "next/link";

const features = [
  {
    title: "Property & unit management",
    description:
      "Manage properties, buildings, and units from one place. Track occupancy, rent amounts, deposits, vacancy status, and unit details with ease.",
  },
  {
    title: "Tenant & lease management",
    description:
      "Keep tenant records organized, manage lease terms, due dates, deposits, contracts, and move-in or move-out workflows without paperwork chaos.",
  },
  {
    title: "Rent, water & tax billing",
    description:
      "Generate rent charges, track water usage from meter readings, manage tax charges, and keep balances, due dates, and payment status visible at all times.",
  },
  {
    title: "Payments & receipts",
    description:
      "Track payments, verify transactions, store references, and issue receipts for rent, water bills, deposits, and other charges.",
  },
  {
    title: "Maintenance & issue tracking",
    description:
      "Log maintenance issues, assign them to caretakers or staff, attach photos, prioritize urgent tasks, and track resolution progress.",
  },
  {
    title: "Inspections & move-outs",
    description:
      "Handle move-out notices, inspection scheduling, inspection checklists, and closure workflows professionally and on time.",
  },
  {
    title: "Team roles & permissions",
    description:
      "Support admins, managers, accountants, office teams, caretakers, tenants, and platform admins with the right level of access.",
  },
  {
    title: "Notifications & accountability",
    description:
      "Send reminders and updates through in-app alerts, SMS, and email while maintaining audit trails for important platform actions.",
  },
];

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight">EstateDesk</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Sign in
            </Link>
            <a
              href="#request-access"
              className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Request access
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              Property Management Platform
            </span>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
              Manage properties, tenants, billing, and operations in one place
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">
              EstateDesk helps property managers and landlords run their
              operations with more control. From tenant onboarding and lease
              tracking to rent collection, water billing, maintenance, and
              inspections, everything is organized in one modern platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#request-access"
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Talk to marketing team
              </a>

              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Explore features
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-2xl font-semibold">All-in-one</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Manage operations from a single dashboard
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-2xl font-semibold">Role-based</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Give each team member the right access
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-2xl font-semibold">Automated</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Track billing, reminders, and workflows better
                </p>
              </div>
            </div>
          </div>

          <div
            id="request-access"
            className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                Request access
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Tell us about your property business and our marketing team will
                reach out to help you get started with EstateDesk.
              </p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Full name
                </label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Company / organization
                </label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
                  placeholder="Enter your company name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Work email
                </label>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
                  placeholder="Enter your work email"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  What do you manage?
                </label>
                <select className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400">
                  <option>Residential properties</option>
                  <option>Commercial properties</option>
                  <option>Mixed-use properties</option>
                  <option>Warehouses / godowns</option>
                  <option>Multiple property types</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
                  placeholder="Tell us about your portfolio, number of units, or what you want to improve"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Contact marketing team
              </button>
            </form>

            <p className="mt-5 text-sm text-neutral-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-neutral-900">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200">
              What EstateDesk can do
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Built for modern property operations
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              EstateDesk supports day-to-day property management workflows across
              administration, finance, tenant management, billing, operations,
              and team accountability.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold tracking-tight text-neutral-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
              <h3 className="text-xl font-semibold text-neutral-950">
                For landlords
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Monitor occupancy, rent collection, tenant records, and property
                performance with better visibility across your portfolio.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
              <h3 className="text-xl font-semibold text-neutral-950">
                For property managers
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Keep teams aligned, track leases, assign caretakers, manage
                billing operations, and resolve maintenance issues faster.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
              <h3 className="text-xl font-semibold text-neutral-950">
                For finance & operations teams
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Reconcile payments, monitor balances, manage receipts, track tax
                obligations, and improve operational accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to modernize your property operations?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
            Speak to our marketing team and see how EstateDesk can support your
            properties, tenants, billing workflows, and operational growth.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#request-access"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Request access
            </a>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}