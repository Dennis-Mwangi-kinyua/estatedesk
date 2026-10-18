export function PlatformDashboardHeading() {
  return <div className="min-w-0 flex-1">
    <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">EstateDesk · Platform administration</p>
    <h1 className="mt-4 max-w-2xl text-[clamp(1.75rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.04em]">Your platform,<br className="hidden sm:block" /> in focus.</h1>
    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">A complete view of your organizations, people and payments. Explore a workspace to review records, manage access and keep operations moving.</p>
  </div>;
}
