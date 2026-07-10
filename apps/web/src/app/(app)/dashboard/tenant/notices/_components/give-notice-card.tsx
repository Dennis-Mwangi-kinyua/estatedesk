import { Send } from "lucide-react";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { submitMoveOutNotice } from "@/app/(app)/dashboard/tenant/notices/actions";
import { EmptySection } from "@/app/(app)/dashboard/tenant/notices/_components/empty-section";

type GiveNoticeCardProps = {
  hasActiveLease: boolean;
};

export function GiveNoticeCard({ hasActiveLease }: GiveNoticeCardProps) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
          Give Notice
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit a move-out notice and alert your organisation for review.
        </p>
      </div>

      {hasActiveLease ? (
        <form action={submitMoveOutNotice} className="space-y-4">
          <div>
            <label
              htmlFor="moveOutDate"
              className="mb-2 block text-sm font-medium text-foreground/80"
            >
              Intended move-out date
            </label>
            <input
              id="moveOutDate"
              name="moveOutDate"
              type="date"
              required
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-neutral-400"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-foreground/80"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={1000}
              placeholder="Add any move-out details or requests."
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-neutral-400"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Notice
          </button>
        </form>
      ) : (
        <EmptySection
          title="No active lease"
          description="You need an active lease before you can submit a move-out notice."
          guideTopic="moveOut"
        />
      )}
    </SurfaceCard>
  );
}