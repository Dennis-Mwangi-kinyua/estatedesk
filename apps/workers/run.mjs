import { pathToFileURL } from 'node:url';
export const jobs = Object.freeze({ notifications: '/api/cron/notifications', recruitment: '/api/cron/recruitment', retention: '/api/cron/retention', 'tenant-credit': '/api/cron/tenant-credit' });
export function workerConfig(env, name) {
  if (!Object.hasOwn(jobs, name)) throw new Error('Choose notifications, recruitment, retention or tenant-credit.');
  const url = new URL(env.APP_URL ?? '');
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new Error('APP_URL must be HTTPS or local development HTTP.');
  if (!env.CRON_SECRET) throw new Error('CRON_SECRET is required.');
  return { url: new URL(jobs[name], url).href, secret: env.CRON_SECRET };
}
export async function runJob(config, fetcher = fetch) {
  const response = await fetcher(config.url, { method: 'GET', redirect: 'error', headers: { authorization: `Bearer ${config.secret}` }, signal: AbortSignal.timeout(65000) });
  await response.body?.cancel();
  if (!response.ok) throw new Error(`Job returned HTTP ${response.status}.`);
  return response.status;
}
async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) { console.log('Usage: npm run worker:run -- [--once] notifications|recruitment|retention|tenant-credit'); return; }
  if (args.some(value => value.startsWith('--') && value !== '--once') || args.filter(value => !value.startsWith('--')).length > 1) throw new Error('Invalid worker arguments.');
  const once = args.includes('--once');
  const name = args.find(value => !value.startsWith('--')) ?? 'notifications';
  const config = workerConfig(process.env, name);
  let stopping = false;
  let timer;
  let wake;
  const stop = () => { stopping = true; clearTimeout(timer); wake?.(); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  const interval = Number(process.env.WORKER_INTERVAL_SECONDS ?? 300);
  if (!Number.isInteger(interval) || interval < 60 || interval > 86400) throw new Error('WORKER_INTERVAL_SECONDS must be 60–86400.');
  do {
    try { await runJob(config); console.log(`${name}: completed`); }
    catch (error) { console.error(`${name}: ${error instanceof Error && /^Job returned HTTP/.test(error.message) ? error.message : 'Request failed; inspect server job history.'}`); if (once) process.exitCode = 1; }
    if (once || stopping) break;
    await new Promise(resolve => { wake = resolve; timer = setTimeout(resolve, interval * 1000); if (stopping) stop(); });
  } while (!stopping);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => { console.error('Worker configuration is invalid. Check APP_URL, CRON_SECRET, job and interval.'); process.exitCode = 1; });
