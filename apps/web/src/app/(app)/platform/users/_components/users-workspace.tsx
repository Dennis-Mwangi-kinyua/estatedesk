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
  } = props.data;
  const params = props.flash;

  return (
    <div className="platform-users-workspace min-w-0 max-w-full space-y-4 overflow-x-clip">
      <PageHeader
        eyebrow="Identity directory"
        title="Platform users"
        description="Find people, review account status, and check workspace access."
        action={<Link href="/platform/users/new" data-workspace-action="true" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus aria-hidden="true" className="h-4 w-4" />Add platform user</Link>}
      />

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
          title="User directory"
          description={`${formatNumber(totalFiltered)} matching ${totalFiltered === 1 ? "account" : "accounts"}`}
        >
          <form aria-label="Filter platform users" className="ed-keep-cols grid grid-cols-2 gap-3 border-b border-neutral-200 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
            <div className="relative col-span-2 min-w-0 lg:col-span-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                aria-label="Search platform users"
                placeholder="Search people…"
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

          {users.length === 0 ? (
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
            total={totalFiltered}
            basePath="/platform/users"
            query={{ q, role, status }}
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
