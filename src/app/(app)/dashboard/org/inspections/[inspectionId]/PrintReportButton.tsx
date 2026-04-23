"use client";

type PrintReportButtonProps = {
  label?: string;
};

export default function PrintReportButton({
  label = "Print / Save PDF",
}: PrintReportButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 print:hidden"
    >
      {label}
    </button>
  );
}