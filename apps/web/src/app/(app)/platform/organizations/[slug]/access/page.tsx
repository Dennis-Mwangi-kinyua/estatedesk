import { createHash } from "node:crypto";
import Link from "@/components/navigation/workspace-link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { ORGANIZATION_ROLES, ORG_VIEW_LABELS, readOrgRolePolicies } from "@/lib/permissions/org-role-policy";
import { ORG_PERMISSIONS, roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { ORG_PERMISSION_LABELS } from "@/lib/permissions/permission-labels";
import { PageHeader, Surface } from "@/app/(app)/platform/_components/control-plane";
import { saveOrganizationRoleAccess } from "./actions";

export default async function OrganizationRoleAccessPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ role?: string; saved?: string; error?: string }>;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const org = await prisma.organization.findFirst({
    where: { slug, deletedAt: null }, include: { settings: { select: { roleAccess: true } } },
  });
  if (!org) notFound();
  const role = ORGANIZATION_ROLES.find(value => value === query.role) ?? "ADMIN";
  const policy = readOrgRolePolicies(org.settings?.roleAccess)[role] ?? { permissions: {}, blockedViews: [] };
  const revision = createHash("sha256").update(JSON.stringify(policy)).digest("hex");
  return <div className="mx-auto w-full max-w-5xl space-y-6">
    <Link href={`/platform/organizations/${org.slug}`} className="text-sm underline">Back to organization</Link>
    <PageHeader eyebrow={org.name} title="Organization role access" description="Set permissions and workspace access for everyone with a role in this organization. Other organizations keep their own rules." />
    <nav aria-label="Organization roles" className="flex flex-wrap gap-2">{ORGANIZATION_ROLES.map(value => <Link key={value} href={`?role=${value}`} aria-current={role === value ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-sm ${role === value ? "bg-primary text-primary-foreground" : "bg-card"}`}>{value}</Link>)}</nav>
    {query.saved ? <p role="status" className="rounded-xl border p-4">Role access saved. Rules are checked on each new request.</p> : null}
    {query.error ? <p role="alert" className="rounded-xl border border-destructive p-4">Unable to save. Reload this page and try again; another administrator may have changed these rules.</p> : null}
    <form action={saveOrganizationRoleAccess.bind(null, org.id)} className="space-y-6">
      <input type="hidden" name="role" value={role} /><input type="hidden" name="revision" value={revision} />
      <Surface title={`${role} permissions`} description="Default retains built-in rights and staff mandates. Allow or deny overrides those permission checks. Role, organization, tenant ownership, and resource boundaries still apply; an allowance does not turn a tenant into staff.">
        <div className="divide-y">{ORG_PERMISSIONS.map(permission => <label key={`${role}:${permission}`} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span><span className="font-medium">{ORG_PERMISSION_LABELS[permission]}</span><span className="block text-xs text-muted-foreground">Role default: {roleHasOrgPermission(role, permission) ? "allowed" : "not allowed"}</span></span>
          <select name={`permission:${permission}`} defaultValue={policy.permissions[permission] ?? "default"} className="min-h-11 rounded-lg border bg-background px-3"><option value="default">Default</option><option value="allow">Allow</option><option value="deny">Deny</option></select>
        </label>)}</div>
      </Surface>
      <Surface title="Blocked workspace sections" description="Checked sections are hidden from shared navigation and blocked on the server. Unchecked sections follow the role's existing access rules. Blocking a section does not grant access to other sections.">
        <div className="grid gap-3 p-4 sm:grid-cols-2">{Object.entries(ORG_VIEW_LABELS).map(([view, label]) => <label key={`${role}:${view}`} className="flex items-center gap-3 rounded-lg border p-3"><input type="checkbox" name="blockedViews" value={view} defaultChecked={policy.blockedViews.includes(view as keyof typeof ORG_VIEW_LABELS)} /><span className="text-sm">{label}</span></label>)}</div>
      </Surface>
      <div className="flex flex-wrap gap-3"><button name="command" value="save" className="min-h-11 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Save {role} access</button><button name="command" value="reset" className="min-h-11 rounded-xl border px-5 py-3">Restore role defaults</button></div>
    </form>
  </div>;
}
