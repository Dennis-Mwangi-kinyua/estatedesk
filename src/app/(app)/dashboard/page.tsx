import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { getDashboardStats } from "@/features/dashboard/queries/get-dashboard-stats";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your estate operations
        </p>
      </div>

      <DashboardStats stats={stats} />
    </div>
  );
}