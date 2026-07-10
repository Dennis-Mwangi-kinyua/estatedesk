export const CARETAKER_OFFLINE_QUEUE_KEY = "estatedesk-caretaker-offline-queue";

export type OfflineQueueItemKind = "meter_reading" | "issue";

export type OfflinePhotoPayload = {
  base64: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type OfflineMeterReadingItem = {
  id: string;
  kind: "meter_reading";
  createdAt: string;
  unitId: string;
  period: string;
  prevReading: number;
  currentReading: number;
  notes?: string;
  photoKey?: string;
  photoPayload?: OfflinePhotoPayload;
};

export type OfflineIssueItem = {
  id: string;
  kind: "issue";
  createdAt: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  unitId?: string;
  propertyId?: string;
  photoKey?: string;
  photoPayload?: OfflinePhotoPayload;
};

export type OfflineQueueItem = OfflineMeterReadingItem | OfflineIssueItem;

function readQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CARETAKER_OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineQueueItem[]) {
  window.localStorage.setItem(
    CARETAKER_OFFLINE_QUEUE_KEY,
    JSON.stringify(items),
  );
  window.dispatchEvent(new CustomEvent("caretaker-offline-queue-change"));
}

export function getOfflineQueueItems() {
  return readQueue();
}

export function getOfflineQueueCount() {
  return readQueue().length;
}

export function enqueueOfflineItem(item: OfflineQueueItem) {
  const items = readQueue();
  writeQueue([item, ...items]);
}

export function removeOfflineQueueItem(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function clearOfflineQueue() {
  writeQueue([]);
}

export function createOfflineId() {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}