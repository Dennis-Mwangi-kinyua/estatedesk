import { ShieldCheck } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { revokeOtherSessionsAction } from "@/app/(app)/dashboard/security/actions";
import type { CaretakerSecurityPageData } from "../_lib/types";

export function SecurityHeader({
  data,
}: {
  data: Pick<CaretakerSecurityPageData, "otherSessionCount">;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Account security
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Active sessions
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              EstateDesk sessions expire after 30 days of inactivity. Review signed-in
              devices and revoke any session you do not recognize.
            </p>

            <InAppGuideHint topic="caretaker" workspace="caretaker" />
          </div>

          {data.otherSessionCount > 0 ? (
            <form action={revokeOtherSessionsAction}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Log out other devices
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
