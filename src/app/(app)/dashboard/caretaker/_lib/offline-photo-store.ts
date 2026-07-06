"use client";

const DB_NAME = "estatedesk-caretaker-offline";
const STORE_NAME = "photos";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB failed"));
  });
}

export async function saveOfflinePhoto(key: string, file: File) {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(
      {
        blob: file,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      },
      key,
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not save offline photo"));
  });

  db.close();
}

export async function loadOfflinePhoto(key: string) {
  const db = await openDb();

  const record = await new Promise<{
    blob: Blob;
    fileName: string;
    mimeType: string;
    size: number;
  } | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error("Could not load photo"));
  });

  db.close();
  return record;
}

export async function removeOfflinePhoto(key: string) {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not remove photo"));
  });

  db.close();
}

export async function offlinePhotoToPayload(key: string) {
  const record = await loadOfflinePhoto(key);
  if (!record) return null;

  const buffer = await record.blob.arrayBuffer();
  const base64 = btoa(
    String.fromCharCode(...new Uint8Array(buffer)),
  );

  return {
    base64,
    fileName: record.fileName,
    mimeType: record.mimeType,
    size: record.size,
  };
}