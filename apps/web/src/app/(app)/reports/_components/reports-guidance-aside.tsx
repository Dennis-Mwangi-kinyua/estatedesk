"use client";

import { FileText } from "lucide-react";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900">{value}</span>
    </div>
  );
}

export function ReportsGuidanceAside() {
  return (
    <WorkspaceGuidePanel
      title="Reports Summary"
      description="Quick overview of what this area supports."
    >
      <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
            <FileText className="h-5 w-5 text-neutral-800" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-950">
              Reports Summary
            </h2>
            <p className="text-sm text-neutral-500">
              Quick overview of what this area supports.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <SummaryRow label="Analytics" value="Ready" />
          <SummaryRow label="Exports" value="Ready" />
          <SummaryRow label="Operational Reports" value="Ready" />
          <SummaryRow label="Database Wiring" value="Next Step" />
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-neutral-950">Next Step</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          This page is set up with a professional mobile-first layout. The next
          step is wiring each report card to real queries, charts, filters, and
          export actions.
        </p>
      </section>
    </WorkspaceGuidePanel>
  );
}