import Link from "next/link";
import { Download, FileArchive } from "lucide-react";
import { requestDataExportAction } from "@/features/settings/actions/settings-actions";
import {
  buttonPrimaryClassName,
  fieldClassName,
  labelClassName,
} from "../../_lib/helpers";
import { formatLabel, type SettingsPageData } from "../../settings-data";
import { EmptyState, SectionCard, StatusBadge } from "../../settings-ui";

export function DataExportSection({ data }: { data: SettingsPageData }) {
  return (
    <SectionCard
      id="data-export"
      title="Data Export"
      description="Request a platform-reviewed CSV archive of your organization data."
    >
      <form action={requestDataExportAction} className="space-y-3">
        <label className={labelClassName}>
          Request reason
          <textarea
            name="reason"
            rows={3}
            placeholder="Audit, migration, compliance review..."
            className={`${fieldClassName} resize-none`}
          />
        </label>

        <button type="submit" className={`w-full gap-2 ${buttonPrimaryClassName}`}>
          <FileArchive className="h-4 w-4" />
          Request CSV Export
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {data.dataExportRequests.length === 0 ? (
          <EmptyState
            title="No export requests"
            description="Approved requests will appear here with a download link."
          />
        ) : (
          data.dataExportRequests.map((request) => {
            const isApproved = request.status === "APPROVED";
            const variant =
              request.status === "APPROVED"
                ? "success"
                : request.status === "REJECTED"
                  ? "danger"
                  : "warning";

            return (
              <div
                key={request.id}
                className="rounded-[18px] border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">
                      Requested {request.requestedAt}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      By {request.requestedBy}
                    </p>
                  </div>
                  <StatusBadge
                    label={formatLabel(request.status)}
                    variant={variant}
                  />
                </div>

                {request.reason ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {request.reason}
                  </p>
                ) : null}

                {request.reviewerNotes ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Platform note: {request.reviewerNotes}
                  </p>
                ) : null}

                {isApproved ? (
                  <Link
                    href={`/api/data-exports/${request.id}/download`}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Download ZIP
                  </Link>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}