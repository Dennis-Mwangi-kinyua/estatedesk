import { getFinanceRequestsPageData as loadFinanceRequestsPageData } from "@/features/accounting-requests/_lib/queries";
import type { FinanceRequestsPageData } from "@/features/accounting-requests/_lib/types";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";

export const FINANCE_REQUESTS_LOAD_ERROR_MESSAGE =
  "We couldn't load finance requests right now. Please refresh the page or try again in a few minutes.";

export type CaretakerFinanceRequestsPageData =
  | { ok: true; data: FinanceRequestsPageData }
  | { ok: false; errorMessage: string };

export async function getCaretakerFinanceRequestsPageData(input: {
  orgId: string;
  userId: string;
  membershipScope: Parameters<
    typeof loadFinanceRequestsPageData
  >[0]["membershipScope"];
  focusId?: string;
}): Promise<CaretakerFinanceRequestsPageData> {
  try {
    const data = await retryTransientDatabaseOperation(
      () =>
        loadFinanceRequestsPageData({
          orgId: input.orgId,
          userId: input.userId,
          workspace: "caretaker",
          membershipScope: input.membershipScope,
          focusId: input.focusId,
        }),
      { label: "caretaker finance requests page data" },
    );

    return { ok: true, data };
  } catch {
    return {
      ok: false,
      errorMessage: FINANCE_REQUESTS_LOAD_ERROR_MESSAGE,
    };
  }
}