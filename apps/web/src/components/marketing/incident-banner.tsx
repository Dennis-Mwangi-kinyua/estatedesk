import { AlertTriangle } from "lucide-react";
import { getPlatformControl, defaultIncidentMessage } from "@/lib/platform/control";

export async function IncidentBanner() {
  try {
    const control = await getPlatformControl();
    if (!control.incidentMode) return null;

    return (
      <div
        role="status"
        aria-live="polite"
        className="border-b border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-50"
      >
        <div className="mx-auto flex max-w-[1536px] items-start gap-2.5 px-3 py-2.5 text-sm sm:px-5 sm:py-3 lg:px-8">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800/90 dark:text-amber-100/90">
              Platform incident
            </p>
            <p className="mt-0.5 min-w-0 text-[13px] leading-5 sm:text-sm">
              {defaultIncidentMessage(control)}
            </p>
          </div>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
