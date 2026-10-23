import Link from "@/components/navigation/workspace-link";
import { Plus } from "lucide-react";
import { Search } from "@/components/shared/colored-icons";
import { PageHeader, PaginationControls, StatCard, Surface, formatNumber } from "../../_components/control-plane";
import { PlatformUserCard } from "./platform-user-card";
import {
  CREATE_ERROR_MESSAGES,
  PLATFORM_ROLE_META,
  ROLE_VALUES,
  STATUS_VALUES,
} from "../_lib/constants";
import { CreatePlatformUserPanel, RoleGuidePanel } from "./users-ui";
import type { getPlatformUsersPageData } from "../_lib/queries";

export type UsersWorkspaceProps = {
  data: Awaited<ReturnType<typeof getPlatformUsersPageData>>;
  flash: { created?: string; createError?: string; archived?: string };
};

export function UsersWorkspace(props: UsersWorkspaceProps) {
  const {
    users,
    totalFiltered,
    totalUsers,
    totalAdmins,
    activeUsers,
    page,
    pageSize,
    q,
    role,
    status,
    organization,
    online,
    organizationName,
    organizationGroups,
    totalGroups,
  } = props.data;
  const params = props.flash;

  return (
    <div className="platform-users-workspace min-w-0 max-w-full space-y-4 overflow-x-clip">
      <PageHeader
        eyebrow="Identity directory"
        title="User accounts"
        description="Choose an organization to find its users and review account access. People with multiple organizations appear in each group."
        action={<Link href="/platform/users/new" data-workspace-action="true" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus aria-hidden="true" className="h-4 w-4" />Add platform user</Link>}
      />

      {online ? <p className="rounded-xl border border-border p-3 text-sm">Showing accounts active in the last five minutes. <Link href="/platform/users" className="font-semibold text-primary">Show all accounts</Link></p> : null}

      {params.created ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Platform user created. They will reset their password and accept the
          terms on first sign-in.
        </div>
      ) : null}

      {params.createError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {CREATE_ERROR_MESSAGES[params.createError] ??
            "Could not create this platform user."}
        </div>
      ) : null}

      {params.archived ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Deleted orphan user: {params.archived}
        </div>
      ) : null}

      <section className="platform-user-stats ed-keep-cols grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Users" value={formatNumber(totalUsers)} />
        <StatCard label="Admins" value={formatNumber(totalAdmins)} />
        <StatCard label="Active" value={formatNumber(activeUsers)} />
        <StatCard label="Matching" value={formatNumber(totalFiltered)} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:items-start">


        <Surface
          className="xl:col-start-2 xl:row-start-1"
          title={organizationName ?? "Users by organization"}
          description={organization ? `${formatNumber(totalFiltered)} matching accounts` : `${formatNumber(totalGroups)} organization groups · Select a card to open its users`}
        >
          {organization ? <Link href="/platform/users" className="inline-flex min-h-11 items-center px-4 py-3 text-sm font-semibold text-primary">← All organizations</Link> : null}
          <form aria-label="Filter platform users" className="ed-keep-cols grid grid-cols-2 gap-3 border-b border-neutral-200 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
            {online ? <input type="hidden" name="online" value="1" /> : null}
            {organization ? <input type="hidden" name="organization" value={organization} /> : null}
            <div className="relative col-span-2 min-w-0 lg:col-span-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                aria-label="Search platform users"
                placeholder={organization ? "Search people…" : "Search organizations or people…"}
                className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-muted/50 py-2.5 pl-10 pr-3 text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <select
              aria-label="Filter by role"
              name="role"
              defaultValue={role ?? ""}
              className="min-w-0 w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground outline-none"
            >
              <option value="">All roles</option>
              {ROLE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {PLATFORM_ROLE_META[value].title}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              name="status"
              defaultValue={status ?? ""}
              className="min-w-0 w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground outline-none"
            >
              <option value="">All statuses</option>
              {STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <button data-workspace-action="true" className="col-span-2 rounded-xl bg-primary lg:col-span-1 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800">
              Apply
            </button>
          </form>

          {!organization ? <div className="platform-user-grid grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 min-[1600px]:grid-cols-3 sm:p-4">
            {organizationGroups.map(group => <Link key={group.id} href={`/platform/users?${new URLSearchParams({ organization: group.id, ...(role ? { role } : {}), ...(status ? { status } : {}), ...(online ? { online: "1" } : {}) })}`} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-primary">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">{group.slug ? "Organization" : "Unassigned accounts"}</span>
              <h3 className="break-words text-base font-semibold text-foreground">{group.name}</h3>
              {group.slug ? <p className="break-all text-xs text-muted-foreground">{group.slug}</p> : null}
              <p className="text-2xl font-semibold text-foreground">{formatNumber(group.count)} <span className="text-sm font-normal text-muted-foreground">{group.count === 1 ? "user" : "users"}</span></p>
              <span className="mt-auto text-sm font-semibold text-primary">View users →</span>
            </Link>)}
            {!organizationGroups.length ? <p className="p-4 text-sm text-muted-foreground">No organizations or users match these filters.</p> : null}
          </div> : users.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-500">
              No users match the current filters.
            </div>
          ) : (
            <div className="platform-user-grid grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 min-[1600px]:grid-cols-3 sm:p-4">
              {users.map(user => <PlatformUserCard key={user.id} user={user} />)}
            </div>
          )}

          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={organization ? totalFiltered : totalGroups}
            basePath="/platform/users"
            query={{ q, role, status, organization, online: online ? "1" : undefined }}
          />
        </Surface>
        <aside className="space-y-4 xl:col-start-1 xl:row-start-1 xl:sticky xl:top-4">
          <RoleGuidePanel />
          <CreatePlatformUserPanel />
        </aside>
      </div>
    </div>
  );
}
