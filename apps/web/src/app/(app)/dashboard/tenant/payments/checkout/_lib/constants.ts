import { METHOD_LABELS as CATALOG_LABELS } from "@/lib/payments/methods-catalog";

export const METHOD_LABELS: Record<string, string> = {
  ...CATALOG_LABELS,
  "kcb-transfer": "KCB Bank Transfer",
  "bank-other": "Bank transfer",
};
