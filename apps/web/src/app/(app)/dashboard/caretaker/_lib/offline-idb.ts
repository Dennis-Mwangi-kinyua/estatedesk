/**
 * IndexedDB multi-store for caretaker offline operations.
 * Stores: queue items, meter photos, inspection logs, room/property snapshots.
 */

"use client";

const DB_NAME = "estatedesk-caretaker-offline";
const DB_VERSION = 2;

export const OFFLINE_STORES = {
  photos: "photos",
  queue: "queue",
  meters: "meters",
  inspections: "inspections",
  propertyCache: "propertyCache",
} as const;

export type OfflineStoreName =
  (typeof OFFLINE_STORES)[keyof typeof OFFLINE_STORES];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of Object.values(OFFLINE_STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

export async function idbPut<T>(
  store: OfflineStoreName,
  key: string,
  value: T,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error(`IndexedDB put failed: ${store}`));
  });
  db.close();
}

export async function idbGet<T>(
  store: OfflineStoreName,
  key: string,
): Promise<T | null> {
  const db = await openDb();
  const value = await new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(key);
    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () =>
      reject(request.error ?? new Error(`IndexedDB get failed: ${store}`));
  });
  db.close();
  return value;
}

export async function idbDelete(
  store: OfflineStoreName,
  key: string,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error(`IndexedDB delete failed: ${store}`));
  });
  db.close();
}

export async function idbGetAllKeys(
  store: OfflineStoreName,
): Promise<string[]> {
  const db = await openDb();
  const keys = await new Promise<string[]>((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).getAllKeys();
    request.onsuccess = () =>
      resolve((request.result as IDBValidKey[]).map(String));
    request.onerror = () =>
      reject(request.error ?? new Error(`IndexedDB keys failed: ${store}`));
  });
  db.close();
  return keys;
}

export async function idbGetAll<T>(store: OfflineStoreName): Promise<T[]> {
  const db = await openDb();
  const values = await new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).getAll();
    request.onsuccess = () => resolve((request.result as T[]) ?? []);
    request.onerror = () =>
      reject(request.error ?? new Error(`IndexedDB getAll failed: ${store}`));
  });
  db.close();
  return values;
}

export type OfflineMeterLog = {
  id: string;
  unitId: string;
  period: string;
  prevReading: number;
  currentReading: number;
  notes?: string;
  photoKey?: string;
  createdAt: string;
  syncedAt?: string | null;
};

export type OfflineInspectionLog = {
  id: string;
  unitId?: string;
  propertyId?: string;
  notes: string;
  roomStatuses?: Array<{ room: string; status: string }>;
  createdAt: string;
  syncedAt?: string | null;
};

export type OfflinePropertySnapshot = {
  propertyId: string;
  name: string;
  units: Array<{ id: string; houseNo: string; status?: string }>;
  cachedAt: string;
};

export async function saveOfflineMeterLog(log: OfflineMeterLog) {
  await idbPut(OFFLINE_STORES.meters, log.id, log);
}

export async function listOfflineMeterLogs() {
  return idbGetAll<OfflineMeterLog>(OFFLINE_STORES.meters);
}

export async function saveOfflineInspectionLog(log: OfflineInspectionLog) {
  await idbPut(OFFLINE_STORES.inspections, log.id, log);
}

export async function cachePropertySnapshot(snapshot: OfflinePropertySnapshot) {
  await idbPut(OFFLINE_STORES.propertyCache, snapshot.propertyId, snapshot);
}

export async function getCachedProperty(propertyId: string) {
  return idbGet<OfflinePropertySnapshot>(
    OFFLINE_STORES.propertyCache,
    propertyId,
  );
}
