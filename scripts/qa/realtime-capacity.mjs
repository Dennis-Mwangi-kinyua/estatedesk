import { readFile, writeFile } from "node:fs/promises";
import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

const origin = new URL(process.env.CAPACITY_BASE_URL ?? "http://127.0.0.1:3158");
const database = new URL(process.env.TEST_DATABASE_URL ?? "");
if (!["127.0.0.1", "localhost"].includes(origin.hostname)
  || !["127.0.0.1", "localhost", "[::1]"].includes(database.hostname)
  || !/test/i.test(database.pathname)) throw new Error("Realtime capacity requires an isolated local app and database.");
const count = Number(process.env.CAPACITY_REALTIME_USERS ?? 1000);
const fixture = JSON.parse(await readFile(process.env.LOAD_SESSIONS_FILE, "utf8"));
if (!Number.isInteger(count) || count < 1 || count > fixture.length) throw new Error("Insufficient realtime session fixtures.");
const sessions = fixture.slice(0, count);
const abort = new AbortController();
const deadline = setTimeout(() => abort.abort(), 45000);
const readers = [];
const streamTasks = [];
const received = new Set();
let current = 0;
let peak = 0;
let ready = 0;
let failed = 0;
let next = 0;
let phase = "connecting";
const client = new Client({ connectionString: database.href });
let orgId;
let expected = new Set();
const tasks = Array.from({ length: 20 }, async () => {
  while (next < sessions.length) {
    const index = next++;
    let markReady;
    let markFailure;
    const becameReady = new Promise((resolve, reject) => { markReady = resolve; markFailure = reject; });
    const task = (async () => {
      let opened = false;
      try {
        const response = await fetch(new URL("/api/realtime", origin), { headers: { cookie: sessions[index].cookieHeader, accept: "text/event-stream" }, signal: abort.signal });
        if (!response.ok || !response.body) throw new Error("Stream rejected");
        const reader = response.body.getReader(); readers.push(reader);
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          let boundary;
          while ((boundary = buffer.indexOf("\n\n")) >= 0) {
            const event = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
            if (event.startsWith("event: ready") && !opened) {
              opened = true; ready++; current++; peak = Math.max(peak, current); markReady();
            }
            if (event.startsWith("event: change") && phase === "mutating") received.add(sessions[index].userId);
          }
        }
        if (phase !== "closing") throw new Error("Stream closed prematurely");
      } catch {
        if (phase !== "closing") failed++;
        markFailure(new Error("Realtime connection failed"));
      } finally { if (opened) current--; }
    })();
    streamTasks.push(task);
    try { await becameReady; } catch { /* Counted without printing credentials. */ }
  }
});
try {
  await Promise.all(tasks);
  await client.connect();
  const member = await client.query('SELECT "orgId" FROM "Membership" WHERE "userId" = $1 LIMIT 1', [sessions[0].userId]);
  orgId = member.rows[0]?.orgId;
  const members = await client.query('SELECT "userId" FROM "Membership" WHERE "orgId" = $1', [orgId]);
  const ids = new Set(sessions.map(session => session.userId));
  expected = new Set(members.rows.map(row => row.userId).filter(id => ids.has(id)));
  phase = "mutating";
  await client.query('UPDATE "Unit" SET notes = $1 WHERE id = (SELECT id FROM "Unit" WHERE "propertyId" IN (SELECT id FROM "Property" WHERE "orgId" = $2) LIMIT 1)', [`Fictional realtime probe ${randomUUID()}`, orgId]);
  for (let i = 0; i < 50 && received.size < expected.size; i++) await sleep(100);
  await sleep(250);
} finally {
  phase = "closing"; clearTimeout(deadline); abort.abort();
  await Promise.allSettled(readers.map(reader => reader.cancel()));
  await Promise.allSettled(streamTasks);
  await client.end();
  const foreignEvents = [...received].filter(id => !expected.has(id)).length;
  const delivered = [...expected].filter(id => received.has(id)).length;
  const passed = ready === count && peak === count && failed === 0 && expected.size > 0 && delivered === expected.size && foreignEvents === 0;
  const report = { environment: "Isolated local application and database, not deployed capacity evidence", requested: count, ready, peakSimultaneousStreams: peak, failed, expectedRecipients: expected.size, delivered, foreignEvents, passed };
  console.log(JSON.stringify(report));
  if (process.env.CAPACITY_REALTIME_REPORT) await writeFile(process.env.CAPACITY_REALTIME_REPORT, JSON.stringify(report, null, 2));
  if (!passed) process.exitCode = 1;
}
