import Link from "@/components/navigation/workspace-link";
import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import { formatCurrency } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseDetailsStats({
  lease,
  currencyCode,
}: {
  lease: LeaseDetailsData["lease"];
  currencyCode: string;
}) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
      <div className="workspace-metric h-full min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><VisualSticker label="Monthly Rent" size="xs" />Monthly Rent</p>
        <p className="mt-3 break-words text-2xl font-semibold tabular-nums">
          {formatCurrency(lease.monthlyRent, currencyCode)}
        </p>
      </div>

      <div className="workspace-metric h-full min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><VisualSticker label="Deposit" size="xs" />Deposit</p>
        <p className="mt-3 break-words text-2xl font-semibold tabular-nums">
          {formatCurrency(lease.deposit, currencyCode)}
        </p>
      </div>

      <div className="workspace-metric h-full min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><VisualSticker label="Due Day" size="xs" />Due Day</p>
        <p className="mt-3 break-words text-2xl font-semibold tabular-nums">{lease.dueDay}</p>
      </div>

      <Link href="#lease-agreement" className="workspace-metric block h-full min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary focus-visible:outline-2 focus-visible:outline-primary">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><VisualSticker label="Contract" size="xs" />Contract</p>
        <p className="mt-3 break-words text-2xl font-semibold tabular-nums">
          {lease.contractDocument ? "Uploaded" : "Missing"}
        </p>
        <p className="mt-2 text-xs text-primary">Manage agreement ↗</p>
      </Link>
    </section>
  );
}