/** Prevent an operational restore from erasing the live database, including pooled aliases. */
export function databaseIdentity(value) {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Restore target must be PostgreSQL.");
  return `${url.hostname.toLowerCase().replace(/-pooler(?=\.)/, "")}:${url.port || "5432"}${decodeURIComponent(url.pathname)}`;
}
export function validateRestoreTarget(target, liveUrls) {
  if (!target) throw new Error("RESTORE_DATABASE_URL must identify a disposable database.");
  const identity = databaseIdentity(target);
  for (const live of liveUrls.filter(Boolean)) {
    if (databaseIdentity(live) === identity) throw new Error("Restore target matches a configured live database. Refusing to erase it.");
  }
}
if (process.argv[1]?.endsWith("validate-restore-target.mjs")) {
  try { validateRestoreTarget(process.env.RESTORE_DATABASE_URL, [process.env.DATABASE_URL, process.env.DIRECT_URL]); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
