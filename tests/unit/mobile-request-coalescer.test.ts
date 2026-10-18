import test from "node:test";
import assert from "node:assert/strict";
import { createRequestCoalescer } from "../../apps/mobile/src/request-coalescer";

test("concurrent identical reads share one request without retaining a response cache", async () => {
  const reads = createRequestCoalescer(); let calls = 0;
  const read = async () => { calls++; return { balance: 25 }; };
  const first = reads.run("user-a:org-a:bills", read);
  const second = reads.run("user-a:org-a:bills", read);
  assert.equal(first, second);
  assert.deepEqual(await first, { balance: 25 }); assert.equal(calls, 1);
  await reads.run("user-a:org-a:bills", read); assert.equal(calls, 2);
});
test("failures remain retryable and different identities never share a read", async () => {
  const reads = createRequestCoalescer();
  await assert.rejects(reads.run("account-a:session", async () => { throw new Error("offline"); }), /offline/);
  assert.equal(await reads.run("account-a:session", async () => "reconnected"), "reconnected");
  const results = await Promise.all([reads.run("account-a:session", async () => "a"), reads.run("account-b:session", async () => "b")]);
  assert.deepEqual(results, ["a", "b"]);
});
test("invalidating reads during account or organization changes cannot erase a newer in-flight request", async () => {
  const reads = createRequestCoalescer(); let release!: (value: string) => void;
  const old = reads.run("same-cookie:units", () => new Promise<string>(resolve => { release = resolve; }));
  await Promise.resolve();
  reads.clear();
  let releaseNew!: (value: string) => void;
  const current = reads.run("same-cookie:units", () => new Promise<string>(resolve => { releaseNew = resolve; }));
  await Promise.resolve(); release("old organization"); await old;
  const shared = reads.run("same-cookie:units", async () => "must not run");
  assert.equal(shared, current); releaseNew("new organization");
  assert.equal(await current, "new organization");
});
