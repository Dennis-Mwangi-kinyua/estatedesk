import type { ReactNode } from "react";
import Link from "@/components/navigation/workspace-link";
import { ArrowLeft } from "lucide-react";
import { VisualSticker } from "@/components/shared/visual-sticker";
import { PlatformUserCreationForm } from "./platform-user-creation-form";
import { CREATE_ERROR_MESSAGES, PLATFORM_PERMISSION_VALUES, PLATFORM_ROLE_META, ROLE_VALUES } from "../../_lib/constants";
import { formatPermission } from "../../_lib/helpers";
import { PageHeader } from "../../../_components/control-plane";
import { CreateUserSubmit } from "./create-user-submit";

const fieldClass = "min-h-12 w-full min-w-0 rounded-xl border border-input bg-muted/40 px-4 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/20";
const permissionGroups = [
  { title: "Organizations", label: "organizations", description: "Choose how this user can manage organization workspaces.", match: (permission: string) => permission.includes("ORGANIZATIONS") },
  { title: "People & access", label: "security", description: "Choose access to user accounts and platform administrators.", match: (permission: string) => permission.includes("PLATFORM_USERS") || permission.includes("PLATFORM_ADMINS") },
  { title: "Finance & reports", label: "reports", description: "Choose access to billing, reports, and exports.", match: (permission: string) => /BILLING|REPORTS/.test(permission) },
  { title: "Platform tools", label: "settings", description: "Choose access to the dashboard, audit logs, and system settings.", match: (permission: string) => /DASHBOARD|AUDIT|SETTINGS/.test(permission) },
];

export function NewPlatformUserWorkspace({ isSuperAdmin, createError }: { isSuperAdmin: boolean; createError?: string }) {
  return <div className="platform-user-create mx-auto w-full max-w-5xl space-y-5">
    <Link href="/platform/users" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to users</Link>
    <PageHeader eyebrow="People & access" title="Add platform user" description="Set up their account, sign-in details, and platform access." />
    {createError && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{CREATE_ERROR_MESSAGES[createError] ?? "Could not create this user. Please try again."}</div>}
    <PlatformUserCreationForm>
      <FormSection title="Account details" label="profile" description="Enter the person's name and contact details.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Full name"><input className={fieldClass} name="fullName" autoComplete="name" placeholder="Jane Mwangi" required /></Field>
          <Field label="Username" help="3–30 letters, numbers, dots, hyphens, or underscores."><input className={fieldClass} name="username" autoComplete="off" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={30} pattern="[a-zA-Z0-9._-]{3,30}" placeholder="jane.mwangi" required /></Field>
          <Field label="Email address"><input className={fieldClass} name="email" type="email" autoComplete="email" placeholder="jane@example.com" required /></Field>
          <Field label="Phone number (optional)"><input className={fieldClass} name="phone" type="tel" autoComplete="tel" placeholder="+254 700 000 000" /></Field>
        </div>
      </FormSection>
      <FormSection title="Sign-in details" label="password" description="Set a temporary password. The user will change it on their first sign-in.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Temporary password" help="Use at least 8 characters."><input className={fieldClass} name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
          <Field label="Confirm temporary password"><input className={fieldClass} name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></Field>
        </div>
      </FormSection>
      <FormSection title="Platform access" label="security" description="Choose the user's role and administrator creation access.">
        <div className="grid items-start gap-5 md:grid-cols-2">
          <Field label="System role"><select name="platformRole" defaultValue="USER" className={fieldClass}>{ROLE_VALUES.filter(role => isSuperAdmin || role !== "SUPER_ADMIN").map(role => <option key={role} value={role}>{PLATFORM_ROLE_META[role].title}</option>)}</select></Field>
          <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-4"><input name="canCreatePlatformAdmins" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-primary" /><span><span className="block text-sm font-medium text-foreground">Allow administrator creation</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">This user can create other platform administrators.</span></span></label>
        </div>
      </FormSection>
      <FormSection title="Permissions" label="permissions" description="Select the tools this account needs. Leave unrelated permissions unchecked.">
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {permissionGroups.map(group => <fieldset key={group.title} className="min-w-0 rounded-xl border border-border p-4 sm:p-5">
            <legend className="px-1 text-sm font-semibold text-foreground">{group.title}</legend>
            <p className="mb-3 text-xs leading-5 text-muted-foreground">{group.description}</p>
            <div className="space-y-1">{PLATFORM_PERMISSION_VALUES.filter(group.match).map(permission => <label key={permission} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted"><input type="checkbox" name="permissions" value={permission} className="h-5 w-5 shrink-0 accent-primary" /><span className="min-w-0 break-words text-sm text-foreground">{formatPermission(permission)}</span></label>)}</div>
          </fieldset>)}
        </div>
      </FormSection>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="mb-4 text-xs leading-5 text-muted-foreground">The user will reset their password and accept the terms on first sign-in.</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end"><Link href="/platform/users" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground">Cancel</Link><CreateUserSubmit /></div>
      </div>
    </PlatformUserCreationForm>
  </div>;
}

function FormSection({ title, label, description, children }: { title: string; label: string; description: string; children: ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-border bg-card">
    <div className="flex items-start gap-3 border-b border-border p-4 sm:p-6"><VisualSticker label={label} size="xs" /><div className="min-w-0"><h2 className="text-base font-semibold text-foreground">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div></div>
    <div className="p-4 sm:p-6">{children}</div>
  </section>;
}

function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return <label className="block min-w-0"><span className="mb-2 block text-sm font-medium text-foreground">{label}</span>{children}{help && <span className="mt-2 block text-xs leading-5 text-muted-foreground">{help}</span>}</label>;
}
