import { Building2, Home, Receipt, Users } from "lucide-react";
import { formatCurrency } from "@/app/(app)/dashboard/landlord/_lib/helpers";
import type { LandlordDashboardData } from "@/app/(app)/dashboard/landlord/_lib/types";

export function SummaryStatsSection({
  data,
}: {
  data: LandlordDashboardData;
}) {
  const items = [
    {
      label: "Properties",
      value: data.properties.length.toLocaleString(),
      icon: Building2,
    },
    {
      label: "Units",
      value: data.units.length.toLocaleString(),
      icon: Home,
    },
    {
      label: "Occupied",
      value: data.occupiedUnits.toLocaleString(),
      icon: Users,
    },
    {
      label: "Total Monthly Income",
      value: formatCurrency(data.monthlyRent),
      icon: Receipt,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="ios-card rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-neutral-500">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-neutral-950">
                  {item.value}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <Icon className="h-[18px] w-[18px]" />
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}