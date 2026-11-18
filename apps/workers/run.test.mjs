import test from 'node:test';
import assert from 'node:assert/strict';
import { workerConfig, runJob } from './run.mjs';
test('worker accepts known jobs and refuses insecure or credential-bearing origins', () => {
  const env = { APP_URL: 'https://example.test', CRON_SECRET: 'secret' };
  assert.equal(workerConfig(env, 'notifications').url, 'https://example.test/api/cron/notifications');
  for (const url of ['http://example.test', 'https://secret@example.test', 'https://example.test/path']) assert.throws(() => workerConfig({ ...env, APP_URL: url }, 'notifications'));
  assert.throws(() => workerConfig(env, 'arbitrary-route'));
});
test('worker authenticates, refuses redirects and reports failures without retries', async () => {
  let calls = 0;
  await assert.rejects(runJob({ url: 'https://example.test/api/cron/notifications', secret: 'secret' }, async (url, options) => { calls++; assert.equal(options.redirect, 'error'); assert.equal(options.headers.authorization, 'Bearer secret'); return new Response('', { status: 503 }); }), /HTTP 503/);
  assert.equal(calls, 1);
});
