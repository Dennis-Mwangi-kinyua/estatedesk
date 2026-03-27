import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Staff</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage staff users.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to Dashboard
        </Link>
      </div>

      <section className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Staff</h2>
        </div>

        {staff.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No staff users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{user.fullName}</td>
                    <td className="px-4 py-3">{user.email ?? "—"}</td>
                    <td className="px-4 py-3">{user.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}