"use client";

type SensitiveDataWatermarkProps = {
  viewerLabel: string;
  orgLabel?: string | null;
};

function buildWatermarkLabel(viewerLabel: string, orgLabel?: string | null) {
  const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const org = orgLabel?.trim();

  return org
    ? `EstateDesk confidential · ${viewerLabel} · ${org} · ${timestamp}`
    : `EstateDesk confidential · ${viewerLabel} · ${timestamp}`;
}

export function SensitiveDataWatermark({
  viewerLabel,
  orgLabel,
}: SensitiveDataWatermarkProps) {
  const label = buildWatermarkLabel(viewerLabel, orgLabel);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden print:hidden"
    >
      <div
        className="absolute inset-[-50%] grid grid-cols-2 gap-16 opacity-[0.08] dark:opacity-[0.12] sm:grid-cols-3 lg:grid-cols-4"
        style={{ transform: "rotate(-24deg)" }}
      >
        {Array.from({ length: 24 }, (_, index) => (
          <p
            key={index}
            className="select-none whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950 dark:text-white"
          >
            {label}
          </p>
        ))}
      </div>
    </div>
  );
}