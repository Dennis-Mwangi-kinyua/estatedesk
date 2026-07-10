import { CheckCircle2 } from "lucide-react";
import { panelShellClassName } from "./profile-ui";

export function ProfileStatusBanner({ message }: { message: string }) {
  return (
    <section
      className={`${panelShellClassName} border-emerald-200 bg-emerald-50/80 px-5 py-4 text-emerald-900 sm:px-6`}
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </section>
  );
}