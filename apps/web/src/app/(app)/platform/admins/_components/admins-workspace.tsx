import { refreshPlatformAdmins } from "../_lib/actions";
import { SubmitButton } from "./submit-button";
import type { AdminRecord } from "../_lib/types";
import { AdminsListSection } from "./admins-list-section";
import { CreateAdminSection } from "./create-admin-section";
import { PageHeader } from "./admins-ui";

export type AdminsWorkspaceProps = {
  admins: AdminRecord[];
};

export function AdminsWorkspace({ admins }: AdminsWorkspaceProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader />
        <form action={refreshPlatformAdmins} className="shrink-0">
          <SubmitButton pendingLabel="Refreshing…" className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-background px-4 text-sm font-medium shadow-sm transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2">Refresh directory</SubmitButton>
        </form>
      </div>
      <section aria-label="Admin account overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total admins", admins.length, "Across the platform"],
          ["Active accounts", admins.filter((admin) => admin.status === "ACTIVE").length, "Currently enabled"],
          ["Inactive accounts", admins.filter((admin) => admin.status !== "ACTIVE").length, "Suspended or disabled"],
          ["Super admins", admins.filter((admin) => admin.platformRole === "SUPER_ADMIN").length, "Highest-level access"],
        ].map(([label, value, description]) => (
          <div key={label} className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>
      <section aria-labelledby="admin-workflow" className="rounded-2xl border bg-muted/30 p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Access management</p>
        <h2 id="admin-workflow" className="mt-2 text-lg font-semibold">A clear path from setup to access review</h2>
        <ol className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            ["Create an account", "Add the admin’s identity and login credentials using the form below."],
            ["Define their access", "Choose a role, account status, and the permissions needed for their work."],
            ["Review the directory", "Find an account, inspect its permissions, and remove access when needed."],
          ].map(([title, description], index) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold">{index + 1}</span>
              <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div>
            </li>
          ))}
        </ol>
      </section>
      <CreateAdminSection />
      <AdminsListSection admins={admins} />
    </div>
  );
}
