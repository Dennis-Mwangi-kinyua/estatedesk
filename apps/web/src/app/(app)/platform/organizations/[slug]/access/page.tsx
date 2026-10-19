import { createHash } from "node:crypto";
import Link from "@/components/navigation/workspace-link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { ORGANIZATION_ROLES, ORG_VIEW_LABELS, readOrgRolePolicies } from "@/lib/permissions/org-role-policy";
import { ORG_PERMISSIONS, roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { ORG_PERMISSION_LABELS } from "@/lib/permissions/permission-labels";
import { ArrowLeft, Check, EyeOff, KeyRound, RotateCcw, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
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
  return <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
    <Link href={`/platform/organizations/${org.slug}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" />Back to organization</Link>
    <PageHeader eyebrow={org.name} title="Organization role access" description="Set permissions and workspace access for everyone with a role in this organization. Other organizations keep their own rules." />
    <section aria-label="Choose a role" className="rounded-2xl border bg-muted/20 p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-4" aria-hidden="true" /></span><div><h2 className="text-sm font-semibold">Access profiles</h2><p className="text-xs text-muted-foreground">Choose the organization role to configure.</p></div></div>
      <nav aria-label="Organization roles" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{ORGANIZATION_ROLES.map(value => <Link key={value} href={`?role=${value}`} aria-current={role === value ? "page" : undefined} className={`flex min-h-[4.25rem] items-center justify-between gap-2 rounded-xl border p-3 text-sm font-semibold transition hover:border-primary/40 hover:bg-primary/5 ${role === value ? "border-primary bg-primary/10 text-primary shadow-sm" : "bg-card text-foreground"}`}><span>{value.replaceAll("_", " ")}</span>{role === value ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <ShieldCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}</Link>)}</nav>
    </section>
    {query.saved ? <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200"><Check className="size-4" aria-hidden="true" />Role access saved. Rules are checked on each new request.</p> : null}
    {query.error ? <p role="alert" className="rounded-xl border border-destructive bg-destructive/5 p-4 text-sm">Unable to save. Reload this page and try again; another administrator may have changed these rules.</p> : null}
    <form action={saveOrganizationRoleAccess.bind(null, org.id)} className="space-y-5 sm:space-y-6">
      <input type="hidden" name="role" value={role} /><input type="hidden" name="revision" value={revision} />
      <Surface title={`${role.replaceAll("_", " ")} permissions`} description="Use the role default or set an explicit override for each capability. Organization, tenant ownership, and resource boundaries still apply.">
        <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">{ORG_PERMISSIONS.map(permission => <label key={`${role}:${permission}`} className="group flex min-w-0 flex-col justify-between gap-4 rounded-xl border bg-background/70 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
          <span className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300"><KeyRound className="size-4" aria-hidden="true" /></span><span className="min-w-0"><span className="block font-semibold leading-5">{ORG_PERMISSION_LABELS[permission]}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Role default: {roleHasOrgPermission(role, permission) ? "Allowed" : "Not allowed"}</span></span></span>
          <span className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Access rule</span><select aria-label={`${ORG_PERMISSION_LABELS[permission]} access rule`} name={`permission:${permission}`} defaultValue={policy.permissions[permission] ?? "default"} className="min-h-10 min-w-32 rounded-lg border bg-card px-3 text-sm font-medium"><option value="default">Role default</option><option value="allow">Allow</option><option value="deny">Deny</option></select></span>
        </label>)}</div>
      </Surface>
      <Surface title="Workspace sections" description="Select sections to block for this role. Blocked sections are hidden from navigation and protected on the server; other sections keep the role’s existing access rules.">
        <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">{Object.entries(ORG_VIEW_LABELS).map(([view, label]) => <label key={`${role}:${view}`} className="flex min-h-[4.5rem] cursor-pointer items-center gap-3 rounded-xl border bg-background/70 p-3 shadow-sm transition hover:border-primary/30 hover:bg-primary/[0.03]"><input className="size-4 accent-primary" type="checkbox" name="blockedViews" value={view} defaultChecked={policy.blockedViews.includes(view as keyof typeof ORG_VIEW_LABELS)} /><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300"><EyeOff className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1 text-sm font-medium">{label}</span><span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Block</span></label>)}</div>
      </Surface>
      <Surface title="Apply access changes" description="Changes are recorded in the organization audit log and checked on each new request.">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><SlidersHorizontal className="size-4" aria-hidden="true" /></span><p className="max-w-xl text-sm leading-5 text-muted-foreground">Save the current access profile, or restore this role’s built-in defaults.</p></div><div className="grid gap-2 sm:flex"><button name="command" value="reset" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted"><RotateCcw className="size-4" aria-hidden="true" />Restore defaults</button><button name="command" value="save" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"><Save className="size-4" aria-hidden="true" />Save {role.replaceAll("_", " ")} access</button></div></div>
      </Surface>
    </form>
  </div>;
}
