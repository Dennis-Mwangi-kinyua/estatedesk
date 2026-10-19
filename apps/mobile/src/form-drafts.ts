import * as SecureStore from "expo-secure-store";
import { randomUUID, digestStringAsync, CryptoDigestAlgorithm } from "expo-crypto";
import type { NativeActionDefinition, NativeActionRequest } from "@estatedesk/contracts/mobile";
import { mobileSessionSchema } from "@estatedesk/contracts/mobile";
import { createDraftStore } from "./draft-store";

export type FormDraft = { values: Record<string, string>; rows: Record<string, { key: number; values: Record<string, string> }[]>; version: string };
const store = createDraftStore({
  get: key => SecureStore.getItemAsync(`forms.${key}`),
  set: (key, value) => SecureStore.setItemAsync(`forms.${key}`, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  remove: key => SecureStore.deleteItemAsync(`forms.${key}`),
  copyPhotos: async () => ({}), removePhotos: async () => {}, clearPhotos: async () => {}, id: randomUUID, now: () => new Date().toISOString(),
});
let epoch = 0;
const issued = new Map<string, number>();
let tail: Promise<unknown> = Promise.resolve();
function serial<T>(action: () => Promise<T>) { const task = tail.then(action); tail = task.catch(() => {}); return task; }
export function clearFormDrafts() { epoch++; issued.clear(); return serial(() => store.clear()); }
export async function formDraftKey(request: Omit<NativeActionRequest, "values">) {
  const generation = epoch;
  const raw = await SecureStore.getItemAsync("estatedesk.profile");
  const session = mobileSessionSchema.parse(JSON.parse(raw ?? "null"));
  if (!session.userId) throw new Error("Refresh your account before saving forms.");
  const key = await digestStringAsync(CryptoDigestAlgorithm.SHA256, JSON.stringify([session.userId, session.organizationId, session.role, session.platformRole, request.kind, request.path, request.actionId, request.recordId]));
  if (generation !== epoch) throw new Error("Your account changed. Reopen the form.");
  issued.set(key, epoch);
  return key;
}
export function formDraftVersion(definition: NativeActionDefinition) {
  return JSON.stringify(definition.groups.flatMap(group => group.fields.filter(field => field.type === "hidden").map(field => [field.name, field.defaultValue])));
}
export function safeFormDraft(definition: NativeActionDefinition, draft: FormDraft): FormDraft {
  const filter = (values: Record<string, string>, fields: NativeActionDefinition["groups"][number]["fields"]) => Object.fromEntries(fields.filter(field => !["password", "signature", "hidden"].includes(field.type) && !/consent|confirm|password|token|secret/i.test(field.name) && typeof values[field.name] === "string").map(field => [field.name, values[field.name]]));
  return { version: formDraftVersion(definition), values: filter(draft.values, definition.groups.filter(group => !group.repeat).flatMap(group => group.fields)), rows: Object.fromEntries(definition.groups.filter(group => group.repeat).map(group => [group.id, (draft.rows[group.id] ?? []).map(row => ({ key: row.key, values: filter(row.values, group.fields) }))])) };
}
export async function loadFormDraft(key: string): Promise<FormDraft | null> {
  const drafts = await store.list(key);
  const draft = drafts.at(-1);
  return draft ? JSON.parse(String(draft.body.state)) as FormDraft : null;
}
export function removeFormDraft(key: string) { return serial(async () => { for (const draft of await store.list(key)) await store.remove(draft.id, key); }); }
export function saveFormDraft(key: string, definition: NativeActionDefinition, input: FormDraft) {
  const generation = epoch;
  return serial(async () => {
    if (generation !== epoch || issued.get(key) !== epoch) throw new Error("Your account changed. Reopen the form.");
    const previous = await store.list(key);
    await store.save({ scope: key, kind: "form", label: definition.id, body: { state: JSON.stringify(safeFormDraft(definition, input)) }, photos: {} });
    for (const draft of previous) await store.remove(draft.id, key);
  });
}
