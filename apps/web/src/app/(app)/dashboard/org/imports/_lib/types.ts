export type ImportHistoryItem = {
  id: string;
  kind: string;
  mode: string;
  status: string;
  totalRows: number;
  createdRows: number;
  errorCount: number;
  rollbackSummary: string | null;
  createdAt: Date;
};