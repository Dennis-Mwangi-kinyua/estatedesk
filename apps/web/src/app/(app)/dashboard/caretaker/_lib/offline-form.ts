"use client";

import {
  createOfflineId,
  enqueueOfflineItem,
  type OfflineIssueItem,
  type OfflineMeterReadingItem,
} from "./offline-queue";
import { removeOfflinePhoto, saveOfflinePhoto } from "./offline-photo-store";

export function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

async function attachPhotoKey(photo?: File | null) {
  if (!photo || photo.size === 0) {
    return undefined;
  }

  const photoKey = `photo-${createOfflineId()}`;
  await saveOfflinePhoto(photoKey, photo);
  return photoKey;
}

export async function queueOfflineMeterReading(input: {
  unitId: string;
  period: string;
  prevReading: number;
  currentReading: number;
  notes?: string;
  photo?: File | null;
}) {
  const photoKey = await attachPhotoKey(input.photo);
  const item: OfflineMeterReadingItem = {
    id: createOfflineId(),
    kind: "meter_reading",
    createdAt: new Date().toISOString(),
    unitId: input.unitId,
    period: input.period,
    prevReading: input.prevReading,
    currentReading: input.currentReading,
    notes: input.notes,
    photoKey,
  };

  enqueueOfflineItem(item);
  return item.id;
}

export async function queueOfflineIssue(input: {
  title: string;
  description: string;
  priority: OfflineIssueItem["priority"];
  unitId?: string;
  propertyId?: string;
  photo?: File | null;
}) {
  const photoKey = await attachPhotoKey(input.photo);
  const item: OfflineIssueItem = {
    id: createOfflineId(),
    kind: "issue",
    createdAt: new Date().toISOString(),
    title: input.title,
    description: input.description,
    priority: input.priority,
    unitId: input.unitId,
    propertyId: input.propertyId,
    photoKey,
  };

  enqueueOfflineItem(item);
  return item.id;
}

export async function clearOfflinePhotoForItem(photoKey?: string) {
  if (!photoKey) return;
  await removeOfflinePhoto(photoKey);
}