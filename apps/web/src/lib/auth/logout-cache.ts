/** Clear disposable browser data without deleting preferences or unsent work. */
export async function clearLogoutCache(browser: Pick<Window, "caches" | "sessionStorage">) {
  const tasks: Promise<unknown>[] = [];
  // Storage can be denied by browser policy. One failure must not skip the rest.
  tasks.push((async () => {
    const names = await browser.caches.keys();
    await Promise.allSettled(names.filter(name => name.startsWith("estatedesk-")).map(name => browser.caches.delete(name)));
  })());
  tasks.push((async () => {
    const storage = browser.sessionStorage;
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
    for (const key of keys) {
      if (key && (key.startsWith("estatedesk.directory:") || key.startsWith("estatedesk:v1:vacancy-inquiries-dismissed:") || key === "estatedesk:last-action")) storage.removeItem(key);
    }
  })());
  await Promise.allSettled(tasks);
}

/** Browser cache APIs can stall; disposable cleanup must not hold logout open. */
export async function clearLogoutCacheWithin(browser: Pick<Window, "caches" | "sessionStorage">, timeoutMs = 500) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      clearLogoutCache(browser),
      new Promise<void>((resolve) => { timer = setTimeout(resolve, timeoutMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
