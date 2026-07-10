import { Laptop, LogOut, Smartphone } from "lucide-react";
import type { ManagedUserSession } from "@/lib/auth/session";
import { logoutAction } from "@/features/auth/actions/logout-action";
import {
  revokeSessionAction,
} from "@/app/(app)/dashboard/security/actions";
import {
  formatSessionDateTime,
  getDeviceLabel,
  isMobileSession,
} from "../_lib/helpers";

export function SessionRow({ session }: { session: ManagedUserSession }) {
  const Icon = isMobileSession(session) ? Smartphone : Laptop;

  return (
    <div className="grid gap-4 border-t border-border px-4 py-4 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground">
            <Icon className="h-4 w-4" />
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
          <span>Started {formatSessionDateTime(session.createdAt)}</span>
          <span>Last seen {formatSessionDateTime(session.lastSeenAt)}</span>
          <span>Expires {formatSessionDateTime(session.expiresAt)}</span>
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