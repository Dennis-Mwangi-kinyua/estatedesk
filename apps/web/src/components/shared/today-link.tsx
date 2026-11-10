import Link from "next/link";

export function TodayLink({ compact = false }: { compact?: boolean }) {
  return <Link href="/dashboard/today" className={`${compact ? "hidden min-[380px]:inline-flex" : "inline-flex"} min-h-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground`} aria-label="Today: my work and messages">Today</Link>;
}
