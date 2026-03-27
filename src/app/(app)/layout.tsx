import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/properties", label: "Properties" },
  { href: "/buildings", label: "Buildings" },
  { href: "/units", label: "Units" },
  { href: "/tenants", label: "Tenants" },
  { href: "/leases", label: "Leases" },
  { href: "/charges", label: "Charges" },
  { href: "/payments", label: "Payments" },
  { href: "/water-bills", label: "Water Bills" },
  { href: "/issues", label: "Issues" },
  { href: "/inspections", label: "Inspections" },
  { href: "/move-outs", label: "Move-Outs" },
  { href: "/notifications", label: "Notifications" },
  { href: "/staff", label: "Staff" },
  { href: "/reports", label: "Reports" },
  { href: "/taxes", label: "Taxes" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/settings", label: "Settings" },
  { href: "/platform", label: "Platform" },
];

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-r bg-white">
          <div className="border-b px-6 py-5">
            <h1 className="text-xl font-bold">EstateDesk</h1>
            <p className="text-sm text-gray-500">Property Management</p>
          </div>

          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-black"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex min-h-screen flex-col">
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Admin Panel</h2>
                <p className="text-sm text-gray-500">
                  Manage properties, tenants, billing, and operations
                </p>
              </div>

              <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
                Dennis
              </div>
            </div>
          </header>

          <section className="flex-1 p-6">{children}</section>
        </main>
      </div>
    </div>
  );
}