import {
  PageHeader,
  StatCard,
  Surface,
  formatNumber,
} from "../../_components/control-plane";
import { formatMoney } from "../_lib/helpers";
import type { getPlatformExpendituresPageData } from "../_lib/queries";
import { ExpenditureForm } from "./expenditure-form";
import { ExpendituresTable } from "./expenditures-table";

export function ExpendituresWorkspace({
  data,
  defaultDate,
}: {
  data: Awaited<ReturnType<typeof getPlatformExpendituresPageData>>;
  defaultDate: string;
}) {
  const { rows, totals } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Internal finance"
        title="Platform expenditures"
        description="Track EstateDesk operating costs separately from customer organizations."
      />

      {totals.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {totals.map((total) => (
            <StatCard
              key={total.currencyCode}
              label={`Total · ${total.currencyCode}`}
              value={formatMoney(total.amount, total.currencyCode)}
            />
          ))}
        </section>
      ) : null}

      <Surface title="Record expenditure">
        <ExpenditureForm defaultDate={defaultDate} />
      </Surface>

      <Surface
        title="Recent expenditures"
        description={`${formatNumber(rows.length)} loaded records`}
      >
        <ExpendituresTable rows={rows} />
      </Surface>
    </div>
  );
}