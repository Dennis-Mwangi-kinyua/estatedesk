import type { ManagedUserSession } from "@/lib/auth/session";
import { SessionRow } from "./session-row";

const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export function DevicesPanel({ sessions }: { sessions: ManagedUserSession[] }) {
  return (
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
  );
}