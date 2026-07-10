import {
  AdminLink,
  Badge,
  EmptyRow,
  formatDateTime,
  toneForStatus,
} from "../../_components/control-plane";

export type SearchResultRow = {
  id: string;
  primary: string;
  secondary: string;
  status: string;
  href: string;
  date: Date;
};

export function SearchResultsSection({
  title,
  count,
  rows,
}: {
  title: string;
  count: number;
  rows: SearchResultRow[];
}) {
  if (count === 0) {
    return null;
  }

  return (
    <section className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
          {title}
        </h3>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
          {count}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Record</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-slate-200 align-top dark:border-white/10"
              >
                <td className="px-4 py-3">
                  <AdminLink href={row.href}>{row.primary}</AdminLink>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {row.secondary}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={toneForStatus(row.status)}>{row.status}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                  {formatDateTime(row.date)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <EmptyRow colSpan={3} label="No matches." />
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}