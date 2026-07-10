import type { DashboardStat } from "@/features/dashboard/queries/get-dashboard-stats";

type DashboardStatsProps = {
  stats: DashboardStat[];
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <p className="text-sm font-medium text-gray-500">{stat.label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{stat.value}</p>
          {stat.helperText ? (
            <p className="mt-2 text-xs text-gray-500">{stat.helperText}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}