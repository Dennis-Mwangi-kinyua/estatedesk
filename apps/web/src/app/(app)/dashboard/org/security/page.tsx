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
} from "../../security/actions";

export const dynamic = "force-dynamic";

const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

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
    <div className="grid gap-4 border-t border-border px-4 py-4 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground">
            <SessionIcon session={session} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">
                {getDeviceLabel(session.userAgent)}
              </p>
              {session.isCurrent ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Current
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              IP {session.ipAddress ?? "unknown"}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <span>Started {formatDateTime(session.createdAt)}</span>
          <span>Last seen {formatDateTime(session.lastSeenAt)}</span>
          <span>Expires {formatDateTime(session.expiresAt)}</span>
        </div>
      </div>

      {session.isCurrent ? (
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted/30 sm:w-auto"
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
            className="inline-flex min-h-10 w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:w-auto"
          >
            Revoke
          </button>
        </form>
      )}
    </div>
  );
}

export default async function OrgSecurityPage() {
  const session = await requireUserSession();
  const sessions = await getManagedUserSessions(session.userId);
  const otherSessionCount = sessions.filter((item) => !item.isCurrent).length;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={`${panelShellClassName} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Account security
            </p>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Active sessions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              EstateDesk sessions expire after 30 minutes. Review signed-in devices
              and revoke any session you do not recognize.
            </p>
          </div>

          {otherSessionCount > 0 ? (
            <form action={revokeOtherSessionsAction}>
              <button
                type="submit"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
              >
                Log out other devices
              </button>
            </form>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Signed in as
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-foreground">
              {session.fullName}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Active sessions
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {sessions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Timeout
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">30 minutes</p>
          </div>
        </div>
      </section>

      <section className={panelShellClassName}>
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-foreground">Devices</h2>
        </div>
        {sessions.length > 0 ? (
          sessions.map((item) => <SessionRow key={item.id} session={item} />)
        ) : (
          <div className="px-5 py-8 text-sm text-muted-foreground">
            No active sessions were found.
          </div>
        )}
      </section>
    </div>
  );
}