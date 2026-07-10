import Link from "next/link";
import { FileText } from "lucide-react";
import { encodePublicId } from "@/lib/public-id";

export function ReportButton({
  inspectionId,
  completed = false,
  disabled = false,
}: {
  inspectionId: string;
  completed?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500">
        <FileText className="mr-2 h-4 w-4" />
        View report
      </span>
    );
  }

  return (
    <Link
      href={`/dashboard/tenant/inspections/${encodePublicId(
        inspectionId,
        "inspection",
      )}`}
      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      <FileText className="mr-2 h-4 w-4" />
      {completed ? "View submitted report" : "View report"}
    </Link>
  );
}