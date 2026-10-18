import * as SecureStore from "expo-secure-store";
import { randomUUID, digestStringAsync, CryptoDigestAlgorithm } from "expo-crypto";
import { File, Directory, Paths } from "expo-file-system";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import { createDraftStore } from "./draft-store";
export type { Draft } from "./draft-store";
const directory = () => new Directory(Paths.document, "estatedesk-field-drafts");
export async function draftScope(session: MobileSession) {
  if (!session.userId || !session.organizationId) throw new Error("Refresh your workspace before saving a draft.");
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, JSON.stringify([session.userId, session.organizationId, session.role]));
}
const store = createDraftStore({
  get: key => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  remove: key => SecureStore.deleteItemAsync(key),
  copyPhotos: async (id, photos) => {
    directory().create({ intermediates: true, idempotent: true });
    return Object.fromEntries(Object.entries(photos).map(([name, photo]) => {
      const file = new File(directory(), `${id}-${name}`);
      new File(photo.uri).copy(file);
      return [name, { ...photo, uri: file.uri }];
    }));
  },
  removePhotos: async id => { const dir = directory(); if (dir.exists) for (const file of dir.list()) if (file instanceof File && file.name.startsWith(`${id}-`)) file.delete(); },
  clearPhotos: async () => { const dir = directory(); if (dir.exists) dir.delete(); },
  id: randomUUID, now: () => new Date().toISOString(),
});
export const listDrafts = store.list;
export const saveDraft = store.save;
export const removeDraft = store.remove;
export const clearDrafts = store.clear;
