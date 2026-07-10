"use client";

export function OwnerStatementPrintControls() {
  return (
    <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
      <p className="text-sm text-neutral-600">Print-friendly owner statement</p>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}