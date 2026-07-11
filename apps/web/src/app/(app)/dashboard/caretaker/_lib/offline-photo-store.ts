"use client";

import {
  idbDelete,
  idbGet,
  idbPut,
  OFFLINE_STORES,
} from "./offline-idb";

type OfflinePhotoRecord = {
  blob: Blob;
  fileName: string;
  mimeType: string;
  size: number;
};

export async function saveOfflinePhoto(key: string, file: File) {
  await idbPut<OfflinePhotoRecord>(OFFLINE_STORES.photos, key, {
    blob: file,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });
}

export async function loadOfflinePhoto(key: string) {
  return idbGet<OfflinePhotoRecord>(OFFLINE_STORES.photos, key);
}

export async function removeOfflinePhoto(key: string) {
  await idbDelete(OFFLINE_STORES.photos, key);
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