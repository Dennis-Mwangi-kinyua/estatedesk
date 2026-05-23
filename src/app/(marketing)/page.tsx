import Link from "next/link";

const features = [
  {
    title: "Property management",
    description:
      "Create properties, buildings, units, tenants, leases, charges, and payments from one organized dashboard.",
  },
  {
    title: "Caretaker workflows",
    description:
      "Assign caretakers to properties, track inspections, manage issues, and keep field operations accountable.",
  },
  {
    title: "Payments and billing",
    description:
      "Record rent, water bills, service charges, taxes, and payment activity with clear organization-level tracking.",
  },
  {
    title: "Role-based access",
    description:
      "Give admins, managers, accountants, office staff, and caretakers the right access for each organization.",
  },
];

const stats = [
  { label: "Roles supported", value: "5+" },
  { label: "Property workflows", value: "All-in-one" },
  { label: "Built for", value: "Kenya" },
];

const steps = [
  {
    title: "Create your organization",
    description:
      "Set up your real estate company or property management office in minutes.",
  },
  {
    title: "Add properties and units",
    description:
      "Organize every property, building, floor, unit, and tenant in one place.",
  },
  {
    title: "Invite your team",
    description:
      "Bring in managers, accountants, office staff, and caretakers with controlled access.",
  },
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.25),transparent_35%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%)]" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            EstateDesk
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="/vacancies" className="transition hover:text-white">
              Vacancies
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:inline-flex"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Get started
            </Link>
          </div>
        </header>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-32 lg:pt-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100">
              Property management made simpler
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Run your real estate operations from one clean dashboard.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              EstateDesk helps property managers organize properties, tenants,
              leases, payments, caretakers, inspections, issues, and staff
              permissions without messy spreadsheets.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
              >
                Start managing properties
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <div className="rounded-2xl bg-white p-5 text-slate-950">
              <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm text-slate-500">Organization</p>
                  <h2 className="font-semibold">EstateDesk Dashboard</h2>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live
                </span>
              </div>

              <div className="grid gap-3">
                {[
                  ["Properties", "24 active"],
                  ["Tenants", "318 records"],
                  ["Payments", "KES tracking"],
                  ["Caretakers", "Assigned"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm text-slate-500">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-slate-950 p-4 text-white">
                <p className="text-sm text-slate-300">Today&apos;s summary</p>
                <p className="mt-2 text-2xl font-bold">12 actions pending</p>
                <p className="mt-1 text-sm text-slate-400">
                  Inspections, payments, and tenant updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-10 sm:grid-cols-3 lg:px-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
            >
              <p className="text-3xl font-bold text-slate-950">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your property team needs.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Built for real estate teams that need structure, accountability, and
            simple daily operations.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-700">
                ✓
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-slate-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Set up once. Manage daily.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-3xl bg-slate-950 px-6 py-12 text-center text-white sm:px-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Ready to get organized?
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Start managing your properties with EstateDesk today.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Create your account, add your organization, and bring your property
            operations into one system.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Create account
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} EstateDesk. All rights reserved.</p>

          <div className="flex gap-5">
            <Link href="/login" className="hover:text-slate-950">
              Login
            </Link>
            <Link href="/register" className="hover:text-slate-950">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}