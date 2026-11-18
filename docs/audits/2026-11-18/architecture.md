# Architecture refactor verification — 18 November 2026

Customer support now has framework-independent domain/application layers, injected repository and throttling ports, a Prisma adapter and a composition root. Web routes and the native support endpoint use the same workflows. Ownership, setup gates, bounded input and mutation throttling are enforced in the application service; transactional writes repeat ownership predicates.

Native record loading is split by organization, landlord and platform with common formatting and entry guards retained. The entry module is reduced from 527 to 141 lines. A standalone worker transport invokes existing authenticated cron handlers and does not introduce a queue or duplicate domain execution.

Architecture checks run in CI across 2,402 modules. The documented baseline has 65 legacy import violations (35 library-to-route and 30 shared-to-web); no runtime cycles were found. Those violations remain a migration backlog. Domain/application/infrastructure dependency rules and new runtime/import violations are enforced for future changes.

Verification passed:

- Full suite: 758 tests, zero failures.
- Support application ownership, setup, throttling and validation tests.
- Disposable PostgreSQL integration test through the application service and real Prisma adapter: customer isolation, platform replies, resolving and reopening.
- Worker transport checks and focused lint.
- Web TypeScript and production build, including the native support endpoint.
- Staged diff and credential-pattern checks.

The full run also corrected stale fixtures and assertions from earlier features, missing setup/demo navigation icon mappings, and a generated retention plan missing recruitment communications. No production database changes were made.

A separate billing review ran eight disposable-database scenarios covering receipt snapshots, partial/excess settlement, duplicate callbacks and move-out concurrency. They passed. Small-device billing acceptance and checkout presentation improvements are separate follow-up work.
