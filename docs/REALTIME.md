# Workspace live updates

Production release, 22 October 2026: deployed as `dpl_421aMiM2SctJN5Ji7XH1dyEz7mrB` on `https://estatedesk.co.ke`. The approved sensitive realtime connection is configured and direct LISTEN/NOTIFY was verified. All 87 migrations are applied and 69 table triggers are installed. The migration initially encountered an existing view; it was corrected to select base tables only, regression-tested locally, marked rolled back and reapplied successfully. The deployed endpoint rejects an invalid session. Authenticated multi-user realtime/device smoke tests remain pending.

Authenticated web workspaces use one Server-Sent Events stream per visible tab at `/api/realtime`. PostgreSQL triggers send scope-only invalidations after commits; the browser groups signals and refreshes the current page through its existing authorized server reads. Hidden/offline tabs disconnect. Changes wait while an input is focused, and reconnects reconcile missed signals. This is invalidation, not offline replication or financial settlement confirmation.

## Deployment

1. Review and apply `20261022140000_workspace_realtime_signals` with the normal migration process.
2. Configure server-only `REALTIME_DATABASE_URL`, or `DIRECT_URL`, with a direct PostgreSQL connection supporting session-level `LISTEN`. Do not use a transaction pooler. The listener shares one connection per active application process and closes it after its last subscriber leaves.
3. Deploy web code with streaming responses enabled. The route has a 60-second runtime budget and rotates streams after 50 seconds to renew authentication. Verify the host supports that duration; each open stream consumes runtime resources. Estimate connection/runtime capacity before scaling.
4. With two authorized accounts, update a unit/payment/issue in one tab and confirm the other updates after commit. Check another organization's account receives no scoped update. Exercise typing, hidden tabs, offline recovery, session expiry and logout.

If streaming is unavailable, the client retries with jittered exponential backoff and uses a 90-second visible-tab refresh fallback. That fallback is not realtime. Heartbeats perform no database queries, but connection establishment authenticates the session and reconnects refresh the current page. Broad organization invalidations can still refresh an unrelated page within the same organization; this implementation does not claim that all database traffic is eliminated.

Triggers cover existing organization/user-scoped tables, organization/user roots, platform controls/onboarding/messages/job runs, and provider job applications/payments/reviews through their parent job. The provider portal subscribes too; marketplace invalidations require a server-verified active provider. Read-side audit, session heartbeat, push transport and export rows are excluded to prevent refresh loops. Add corresponding triggers/scoping when introducing new tables, especially child tables without organization/user identifiers. Public marketing pages and native apps do not subscribe in this release; native app push delivery remains separate.

Signals contain no records. Server-side session resolution selects the active organization/user; only platform administrators viewing the platform workspace receive the platform signal. Record visibility and mutation authorization remain enforced by existing reads/actions. Scope signals are organization-level, so scoped members may receive an invalidation for a record they cannot read; they receive no contents or identifiers from it.

`LISTEN`/`NOTIFY` does not retain events for disconnected clients. The first read after subscription and every reconnect reconcile current data. PostgreSQL delivers notifications only after successful transaction commit and folds identical notifications within one transaction: [NOTIFY documentation](https://www.postgresql.org/docs/current/sql-notify.html), [LISTEN setup semantics](https://www.postgresql.org/docs/current/sql-listen.html).

Verification: `node --import tsx --test tests/unit/realtime-*.test.ts`. The transaction integration test requires an explicitly configured disposable local `TEST_DATABASE_URL` and runs from `tests/integration/realtime-signals.integration.ts`.
