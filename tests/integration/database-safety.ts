/** Integration tests may only mutate an explicitly configured disposable local database. */
export function configureTestDatabase() {
  const value = process.env.TEST_DATABASE_URL;
  if (!value) return undefined;
  const url = new URL(value);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || !/test/i.test(url.pathname)) {
    throw new Error("Integration tests require a disposable local database with 'test' in its name. Refusing to modify this database.");
  }
  process.env.DATABASE_URL = value;
  process.env.DIRECT_URL = value;
  return value;
}
