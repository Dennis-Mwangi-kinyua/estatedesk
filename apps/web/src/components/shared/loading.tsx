import { Loader2 } from "lucide-react";

type LoadingProps = {
  label?: string;
};

export function AppLoading({ label = "Loading" }: LoadingProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/35 px-4 backdrop-blur-[3px] dark:bg-slate-950/35"
      role="status"
      aria-live="polite"
    >
      <div className="inline-flex min-h-11 items-center gap-3 rounded-full border border-slate-200 bg-white/94 px-4 text-sm font-semibold text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-900/94 dark:text-slate-100">
        <Loader2 className="h-4 w-4 animate-spin text-slate-500 dark:text-slate-300" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export default AppLoading;
