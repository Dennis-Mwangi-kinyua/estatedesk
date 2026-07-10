export function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          {label}
        </p>
        <p className="text-base font-semibold text-neutral-950">{value}</p>
      </div>
    </div>
  );
}

export function InfoRow({
  icon,
  label,
  value,
  breakValue = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  breakValue?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-neutral-500">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      <p
        className={`text-sm font-medium text-neutral-900 ${
          breakValue ? "break-all" : "break-words"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function Tag({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
      {icon}
      {children}
    </span>
  );
}

export function MiniTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700">
      {children}
    </span>
  );
}

export function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="max-w-[60%] break-words text-right text-sm font-medium text-neutral-900">
        {value}
      </span>
    </div>
  );
}

export function ControlField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-800">
        {label}
      </span>
      {children}
    </label>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}
