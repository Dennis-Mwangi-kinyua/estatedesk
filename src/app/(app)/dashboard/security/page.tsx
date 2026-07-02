import { Clock3, Laptop, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import {
  getManagedUserSessions,
  requireUserSession,
  type ManagedUserSession,
} from "@/lib/auth/session";
import { logoutAction } from "@/features/auth/actions/logout-action";
import {
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "./actions";

export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: Date) {
  return dateTimeFormatter.format(value);
}

function getDeviceLabel(userAgent: string | null) {
  if (!userAgent) return "Unknown device";

  const lower = userAgent.toLowerCase();
  const browser = lower.includes("edg/")
    ? "Edge"
    : lower.includes("chrome/")
      ? "Chrome"
      : lower.includes("safari/")
        ? "Safari"
        : lower.includes("firefox/")
          ? "Firefox"
          : "Browser";

  const device = lower.includes("mobile")
    ? "Mobile"
    : lower.includes("tablet") || lower.includes("ipad")
      ? "Tablet"
      : "Desktop";

  return `${browser} on ${device}`;
}

function SessionIcon({ session }: { session: ManagedUserSession }) {
  const userAgent = session.userAgent?.toLowerCase() ?? "";
  const Icon = userAgent.includes("mobile") ? Smartphone : Laptop;

  return <Icon className="h-4 w-4" />;
}

function SessionRow({ session }: { session: ManagedUserSession }) {
  return (
    <div className="grid gap-4 border-t border-slate-200 px-4 py-4 first:border-t-0 dark:border-white/10 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
            <SessionIcon session={session} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-950 dark:text-white">
                {getDeviceLabel(session.userAgent)}
              </p>
              {session.isCurrent ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Current
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              IP {session.ipAddress ?? "unknown"}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
          <span>Started {formatDateTime(session.createdAt)}</span>
          <span>Last seen {formatDateTime(session.lastSeenAt)}</span>
          <span>Expires {formatDateTime(session.expiresAt)}</span>
        </div>
      </div>

      {session.isCurrent ? (
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:w-auto"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </form>
      ) : (
        <form action={revokeSessionAction}>
          <input type="hidden" name="sessionId" value={session.id} />
          <button
            type="submit"
            className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:w-auto"
          >
            Revoke
          </button>
        </form>
      )}
    </div>
  );
}

export default async function DashboardSecurityPage() {
  const session = await requireUserSession();
  const sessions = await getManagedUserSessions(session.userId);
  const otherSessionCount = sessions.filter((item) => !item.isCurrent).length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                <ShieldCheck className="h-4 w-4" />
                Account security
              </p>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Active sessions
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                EstateDesk sessions now expire after 30 minutes. Review signed-in devices and revoke any session you do not recognize.
              </p>
            </div>

            {otherSessionCount > 0 ? (
              <form action={revokeOtherSessionsAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  Log out other devices
                </button>
              </form>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Signed in as
              </p>
              <p className="mt-2 truncate text-sm font-semibold text-slate-950">
                {session.fullName}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Active sessions
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {sessions.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <Clock3 className="h-4 w-4" />
                Timeout
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                30 minutes
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold text-slate-950">
              Devices
            </h2>
          </div>
          {sessions.length > 0 ? (
            sessions.map((item) => <SessionRow key={item.id} session={item} />)
          ) : (
            <div className="px-5 py-8 text-sm text-slate-600">
              No active sessions were found.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
