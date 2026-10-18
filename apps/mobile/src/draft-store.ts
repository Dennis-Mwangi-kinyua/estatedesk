import type { Photo } from "./photo-types";
export type Draft = { id: string; scope: string; kind: "meter" | "inspection"; label: string; createdAt: string; body: Record<string, string | number>; photos: Record<string, Photo> };
type Entry = { id: string; scope: string; chunks: number; pending?: true };
export type DraftStorage = {
  get: (key: string) => Promise<string | null>; set: (key: string, value: string) => Promise<void>; remove: (key: string) => Promise<void>;
  copyPhotos: (id: string, photos: Record<string, Photo>) => Promise<Record<string, Photo>>;
  removePhotos: (id: string) => Promise<void>; clearPhotos: () => Promise<void>;
  id: () => string; now: () => string;
};
const INDEX = "estatedesk.drafts.index";
const key = (id: string, part: number) => `estatedesk.draft.${id}.${part}`;
/** Serialize read/modify/write operations so two quick taps cannot lose drafts. */
export function createDraftStore(storage: DraftStorage) {
  let tail: Promise<unknown> = Promise.resolve();
  function serial<T>(action: () => Promise<T>): Promise<T> { const task = tail.then(action); tail = task.catch(() => {}); return task; }
  async function entries(): Promise<Entry[]> { return JSON.parse(await storage.get(INDEX) ?? "[]"); }
  async function clean(entry: Entry) {
    await storage.removePhotos(entry.id);
    for (let part = 0; part < entry.chunks; part++) await storage.remove(key(entry.id, part));
  }
  async function recover() {
    const index = await entries();
    // Incomplete saves are registered first, so interrupted writes can be cleaned on restart.
    for (const entry of index.filter(e => e.pending)) await clean(entry);
    const complete = index.filter(e => !e.pending);
    if (complete.length !== index.length) await storage.set(INDEX, JSON.stringify(complete));
    return complete;
  }
  async function read(entry: Entry): Promise<Draft> {
    let json = "";
    for (let part = 0; part < entry.chunks; part++) {
      const chunk = await storage.get(key(entry.id, part));
      if (chunk === null) throw new Error("A saved draft is incomplete. Delete it and recreate the report.");
      json += chunk;
    }
    const draft: Draft = JSON.parse(json);
    if (draft.id !== entry.id || draft.scope !== entry.scope) throw new Error("Draft identity does not match this workspace.");
    return draft;
  }
  return {
    list: (scope: string) => serial(async () => Promise.all((await recover()).filter(e => e.scope === scope).map(read))),
    save: (input: Omit<Draft, "id" | "createdAt">) => serial(async () => {
      const index = await recover();
      if (index.length >= 12) throw new Error("Sync or remove a draft before adding more (12 maximum).");
      const id = storage.id();
      const draft: Draft = { ...input, id, createdAt: storage.now() };
      // Reserve enough tracked chunks before touching files or keychain content.
      const pending: Entry = { id, scope: input.scope, chunks: 40, pending: true };
      await storage.set(INDEX, JSON.stringify([...index, pending]));
      try {
        draft.photos = await storage.copyPhotos(id, input.photos);
        const json = JSON.stringify(draft);
        if (json.length > 16000) throw new Error("Draft is too large. Shorten the report notes.");
        let chunks = 0;
        // <= 1800 UTF-8 bytes per entry, including non-ASCII notes.
        const characters = Array.from(json);
        for (let offset = 0; offset < characters.length; offset += 450) await storage.set(key(id, chunks++), characters.slice(offset, offset + 450).join(""));
        await storage.set(INDEX, JSON.stringify([...index, { id, scope: input.scope, chunks }]));
        return draft;
      } catch (error) {
        await clean(pending);
        await storage.set(INDEX, JSON.stringify(index));
        throw error;
      }
    }),
    remove: (id: string, scope: string) => serial(async () => {
      const index = await recover(); const entry = index.find(e => e.id === id && e.scope === scope);
      if (!entry) return;
      await clean(entry);
      await storage.set(INDEX, JSON.stringify(index.filter(e => e.id !== id)));
    }),
    clear: () => serial(async () => {
      for (const entry of await entries()) await clean(entry);
      await storage.clearPhotos(); await storage.remove(INDEX);
    }),
  };
}
