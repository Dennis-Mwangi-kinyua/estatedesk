# EstateDesk worker runner

This is a standalone Node.js 24 scheduling process. It invokes the same authenticated HTTP cron handlers used by hosting schedules. It does not import Next.js request context or duplicate business logic.

From the repository root:

```sh
npm run worker:test
npm run worker:run -- --once notifications
npm run worker:run -- notifications
```

Set `APP_URL` to the deployed backend origin and `CRON_SECRET` to its cron bearer secret. Root `.env` is loaded when present; deployed environment variables take precedence. HTTPS is required except for localhost development. Secrets and response bodies are never logged. `WORKER_INTERVAL_SECONDS` defaults to 300 and must be between 60 and 86,400. Choose `notifications`, `recruitment`, `retention` or `tenant-credit` explicitly. Do not run financial/daily jobs every five minutes merely because that is the default interval.

For VPS systemd timers or cron, prefer `--once` and schedule each job at the intended cadence. Run notifications regularly so the existing dispatcher can reconcile provider receipts. Disable duplicate hosting/GitHub schedules when switching ownership to the VPS. No VPS service is installed or enabled by this repository change.

Requests time out after 65 seconds, reject redirects and return a nonzero exit for failed one-shot execution. The loop runs one request at a time, waits between attempts and handles SIGINT/SIGTERM after the current request. An uncertain result is not immediately retried. Backend claims/idempotency and recorded job history remain authoritative; this runner is not a durable queue or an exactly-once guarantee. Investigate server job history after failures.
