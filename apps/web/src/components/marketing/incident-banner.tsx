import { AlertTriangle } from "lucide-react";
import { getPlatformControl, defaultIncidentMessage } from "@/lib/platform/control";

export async function IncidentBanner() {
  try {
    const control = await getPlatformControl();
    if (!control.incidentMode) return null;

    return (
      <div className="border-b border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-50">
        <div className="mx-auto flex max-w-[1536px] items-start gap-2 px-3 py-2.5 text-sm sm:px-6 lg:px-8">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="min-w-0 leading-5">{defaultIncidentMessage(control)}</p>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
