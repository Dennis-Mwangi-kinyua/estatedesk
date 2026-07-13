import { Clock3, ShieldCheck } from "lucide-react";
import type { ManagedUserSession } from "@/lib/auth/session";
import { revokeOtherSessionsAction } from "@/app/(app)/dashboard/security/actions";
import { SESSION_TIMEOUT_LABEL } from "../_lib/helpers";
import { DevicesPanel } from "./devices-panel";

const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export function SecuritySessionsContent({
  fullName,
  sessions,
  otherSessionCount,
}: {
  fullName: string;
  sessions: ManagedUserSession[];
  otherSessionCount: number;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-6 sm:space-y-6">
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
              EstateDesk sessions expire after 30 days of inactivity. Review signed-in
              devices and revoke any session you do not recognize.
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
              {fullName}
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
            <p className="mt-2 text-sm font-semibold text-foreground">
              {SESSION_TIMEOUT_LABEL}
            </p>
          </div>
        </div>
      </section>

      <DevicesPanel sessions={sessions} />
    </div>
  );
}
