/** Collapse old delivery copies without hiding a reminder on another day. Rows are newest first. */
export function collapseNotificationCopies<T extends { type: string; title: string; message: string; createdAt: Date | string }>(rows: T[]) {
  const latest = new Map<string, number>();
  return rows.filter(row => {
    const key = JSON.stringify([row.type, row.title, row.message]);
    const time = new Date(row.createdAt).getTime();
    const previous = latest.get(key);
    if (previous !== undefined && previous - time <= 600_000) return false;
    latest.set(key, time);
    return true;
  });
}
