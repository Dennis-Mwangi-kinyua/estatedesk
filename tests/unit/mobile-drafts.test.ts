import test from "node:test";
import assert from "node:assert/strict";
import { createDraftStore, type DraftStorage } from "../../apps/mobile/src/draft-store";
function fixture() {
  const values = new Map<string, string>(); const photos = new Set<string>(); let id = 0;
  const storage: DraftStorage = {
    get: async key => values.get(key) ?? null,
    set: async (key, value) => { assert.equal(Buffer.from(value).toString(), value, "Chunk boundaries preserve Unicode"); assert.ok(Buffer.byteLength(value) <= 2048, "Keychain entries stay bounded"); values.set(key, value); },
    remove: async key => { values.delete(key); },
    copyPhotos: async (id, input) => { photos.add(id); return Object.fromEntries(Object.entries(input).map(([key, photo]) => [key, { ...photo, uri: `private/${id}/${key}` }])); },
    removePhotos: async id => { photos.delete(id); }, clearPhotos: async () => { photos.clear(); },
    id: () => `draft-${String(++id).padStart(16, "0")}`, now: () => "2026-10-18T12:00:00Z",
  };
  return { values, photos, storage, store: createDraftStore(storage) };
}
const draft = { scope: "a".repeat(64), kind: "meter" as const, label: "Meter · Example / A1", body: { unitId: "unit", period: "2026-10", currentReading: 123, notes: "Draft reading" }, photos: { photo: { uri: "temporary.jpg", type: "image/jpeg", name: "evidence.jpg" } } };
test("drafts persist across restart, stay scoped, and serialize concurrent writes", async () => {
  const f = fixture();
  const [first, second] = await Promise.all([f.store.save(draft), f.store.save({ ...draft, scope: "b".repeat(64) })]);
  const reopened = createDraftStore(f.storage);
  assert.deepEqual((await reopened.list(draft.scope)).map(d => d.id), [first.id]);
  assert.equal((await reopened.list("different-user-or-org")).length, 0);
  assert.match((await reopened.list(draft.scope))[0].photos.photo.uri, /^private\//);
  await reopened.remove(first.id, "wrong-scope"); assert.equal((await reopened.list(draft.scope)).length, 1);
  await reopened.remove(first.id, draft.scope); assert.equal((await reopened.list(draft.scope)).length, 0);
  assert.ok(f.photos.has(second.id)); assert.ok(!f.photos.has(first.id));
  await reopened.clear(); assert.equal(f.values.size, 0); assert.equal(f.photos.size, 0);
});
test("keychain failure retains earlier drafts and removes partial evidence and chunks", async () => {
  const f = fixture(); const first = await f.store.save(draft); const original = f.storage.set;
  let failOnce = true;
  f.storage.set = async (key, value) => { if (key.endsWith(".1") && failOnce) { failOnce = false; throw new Error("Keychain full"); } await original(key, value); };
  await assert.rejects(() => f.store.save({ ...draft, body: { ...draft.body, notes: "long note ".repeat(200) } }), /Keychain full/);
  assert.deepEqual((await f.store.list(draft.scope)).map(d => d.id), [first.id]); assert.equal(f.photos.size, 1);
  assert.equal([...f.values.keys()].filter(k => k.includes("draft-0000000000000002")).length, 0);
});
test("interrupted writes are recovered and a full queue never overwrites unsent work", async () => {
  const f = fixture();
  f.values.set("estatedesk.drafts.index", JSON.stringify([{ id: "interrupted", scope: draft.scope, chunks: 2, pending: true }]));
  f.values.set("estatedesk.draft.interrupted.0", "incomplete"); f.photos.add("interrupted");
  assert.equal((await f.store.list(draft.scope)).length, 0); assert.equal(f.photos.size, 0); assert.ok(!f.values.has("estatedesk.draft.interrupted.0"));
  for (let i = 0; i < 12; i++) await f.store.save({ ...draft, body: { ...draft.body, notes: "🏠".repeat(1000) } });
  await assert.rejects(() => f.store.save(draft), /12 maximum/); assert.equal((await f.store.list(draft.scope)).length, 12);
  await f.store.clear(); assert.equal(f.values.size, 0);
});
