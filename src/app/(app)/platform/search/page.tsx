import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  Surface,
  formatDateTime,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function GlobalSearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const hasQuery = q.length >= 2;
  const textFilter = { contains: q, mode: "insensitive" as const };

  const orgs = hasQuery
    ? await prisma.organization.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: textFilter },
            { slug: textFilter },
            { email: textFilter },
            { phone: textFilter },
          ],
        },
        take: 10,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          updatedAt: true,
        },
      })
    : [];

  const users = hasQuery
    ? await prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { fullName: textFilter },
            { email: textFilter },
            { phone: textFilter },
            { username: textFilter },
          ],
        },
        take: 10,
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          username: true,
          phone: true,
          platformRole: true,
          updatedAt: true,
        },
      })
    : [];

  const tenants = hasQuery
    ? await prisma.tenant.findMany({
        where: {
          deletedAt: null,
          OR: [
            { fullName: textFilter },
            { email: textFilter },
            { phone: textFilter },
            { nationalId: textFilter },
            { kraPin: textFilter },
          ],
        },
        take: 10,
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          fullName: true,
          phone: true,
          status: true,
          updatedAt: true,
          org: { select: { id: true, name: true, slug: true } },
        },
      })
    : [];

  const payments = hasQuery
    ? await prisma.payment.findMany({
        where: {
          OR: [
            { reference: textFilter },
            { externalReference: textFilter },
            { checkoutRequestId: textFilter },
            { merchantRequestId: textFilter },
            { phoneUsed: textFilter },
            { payerName: textFilter },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          externalReference: true,
          checkoutRequestId: true,
          amount: true,
          targetType: true,
          gatewayStatus: true,
          createdAt: true,
          org: { select: { id: true, name: true, slug: true } },
        },
      })
    : [];

  const units = hasQuery
    ? await prisma.unit.findMany({
        where: {
          deletedAt: null,
          OR: [{ houseNo: textFilter }, { property: { name: textFilter } }],
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          houseNo: true,
          status: true,
          updatedAt: true,
          property: { select: { name: true, org: { select: { id: true, name: true } } } },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Global search"
        title="Search the platform"
        description="Find organizations, users, tenants, payment references, phone numbers, and units from one place."
      />

      <form className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <label htmlFor="q" className="text-sm font-medium text-neutral-700">
          Search query
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Name, email, phone, receipt, unit, slug..."
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-neutral-400"
          />
          <button className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">
            Search
          </button>
        </div>
      </form>

      {!hasQuery ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Enter at least 2 characters to search.
        </div>
      ) : null}

      <Surface title="Organizations">
        <ResultTable
          rows={orgs.map((org) => ({
            id: org.id,
            primary: org.name,
            secondary: `/${org.slug}`,
            status: org.status,
            href: `/platform/organizations/${org.id}`,
            date: org.updatedAt,
          }))}
        />
      </Surface>

      <Surface title="Users">
        <ResultTable
          rows={users.map((user) => ({
            id: user.id,
            primary: user.fullName,
            secondary: user.email ?? user.username ?? user.phone ?? "-",
            status: user.platformRole,
            href: `/platform/users/${user.id}`,
            date: user.updatedAt,
          }))}
        />
      </Surface>

      <Surface title="Tenants">
        <ResultTable
          rows={tenants.map((tenant) => ({
            id: tenant.id,
            primary: tenant.fullName,
            secondary: `${tenant.org.name} • ${tenant.phone}`,
            status: tenant.status,
            href: `/platform/organizations/${tenant.org.id}`,
            date: tenant.updatedAt,
          }))}
        />
      </Surface>

      <Surface title="Payments">
        <ResultTable
          rows={payments.map((payment) => ({
            id: payment.id,
            primary: payment.reference ?? payment.externalReference ?? payment.checkoutRequestId ?? payment.id,
            secondary: `${payment.org.name} • ${payment.targetType} • KES ${Number(payment.amount).toLocaleString("en-KE")}`,
            status: payment.gatewayStatus,
            href: `/platform/organizations/${payment.org.id}`,
            date: payment.createdAt,
          }))}
        />
      </Surface>

      <Surface title="Units">
        <ResultTable
          rows={units.map((unit) => ({
            id: unit.id,
            primary: `Unit ${unit.houseNo}`,
            secondary: `${unit.property.org.name} • ${unit.property.name}`,
            status: unit.status,
            href: `/platform/organizations/${unit.property.org.id}`,
            date: unit.updatedAt,
          }))}
        />
      </Surface>
    </div>
  );
}

function ResultTable({
  rows,
}: {
  rows: Array<{
    id: string;
    primary: string;
    secondary: string;
    status: string;
    href: string;
    date: Date;
  }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Record</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-neutral-100">
              <td className="px-4 py-3">
                <AdminLink href={row.href}>{row.primary}</AdminLink>
                <p className="mt-1 text-xs text-neutral-500">{row.secondary}</p>
              </td>
              <td className="px-4 py-3">
                <Badge tone={toneForStatus(row.status)}>{row.status}</Badge>
              </td>
              <td className="px-4 py-3 text-neutral-600">{formatDateTime(row.date)}</td>
            </tr>
          ))}
          {rows.length === 0 ? <EmptyRow colSpan={3} label="No matches." /> : null}
        </tbody>
      </table>
    </div>
  );
}
