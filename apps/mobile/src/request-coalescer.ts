/** Share simultaneous reads only; no response cache and no queued mutations. */
export function createRequestCoalescer() {
  const pending = new Map<string, Promise<unknown>>();
  return {
    clear() { pending.clear(); },
    run(key: string, read: () => Promise<unknown>): Promise<unknown> {
      const existing = pending.get(key);
      if (existing) return existing;
      const result = Promise.resolve().then(read).finally(() => {
        if (pending.get(key) === result) pending.delete(key);
      });
      pending.set(key, result);
      return result;
    },
  };
}
