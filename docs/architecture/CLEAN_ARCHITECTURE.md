# Feature boundaries and dependency rules

EstateDesk remains a modular monolith with one web backend and shared database. Web, native and worker transports should call shared workflows. Process separation is introduced where operations require it; a directory named `services` does not imply an independently deployed service.

## Implemented customer support boundary

```text
Web pages / Server Actions      Native HTTP endpoint
              \                  /
               feature/index.ts
                      |
             application/service.ts
                /             \
       domain/policy.ts     application/ports.ts
                                  ^
                      infrastructure/prisma-repository.ts
```

- `domain`: pure validation and authorization policy; no Next.js, Prisma or application imports.
- `application`: create/list/read/reply/resolve use cases, setup gates, ownership scope and throttling through injected dependencies. No framework or database imports.
- `infrastructure`: Prisma queries and transactions. Ownership predicates are applied again in transactional writes to prevent a read/write race.
- `index.ts`: composition root wiring the Prisma adapter and rate limiter.
- Route adapters: obtain a trusted server session, invoke a workflow and translate the result to redirects, revalidation, HTML or JSON. Actor identity never comes from submitted form fields.

The web routes and `/api/mobile/support` use the same service instance. The native endpoint adds the existing native session, bounded-body and rate-limit boundary. This provides a native transport; it does not add a native support screen. The old `policy.ts` remains a compatibility re-export.

Use this structure when migrating another feature. Add repository interfaces only where separating persistence or testing a workflow requires them. Preserve payment allocation, authorization, audit and transaction semantics while moving code. Existing payment/occupancy services should be extended rather than duplicated in route handlers.

## Native record modules

`native-workspace-records.ts` retains entry guards and common dispatch. Organization, landlord and platform record implementations live in `native-records-{organization,landlord,platform}.ts`; display formatting lives in `native-records-display.ts`. Existing resource scopes and query bodies are retained. These are transport/query modules, not newly isolated domain services.

## Architecture enforcement

Run `npm run architecture:check`. CI checks local static/dynamic import edges across web, shared packages and services. It rejects new runtime cycles, new library-to-route imports, new shared-to-web imports, forbidden dependencies in feature domain/application layers, infrastructure imports of routes/UI, and direct Prisma imports in customer support routes. Type-only edges do not create runtime cycles; authorization rules still apply to their dependencies.

`legacy-boundaries.json` records 65 existing import violations: 35 library-to-route imports and 30 shared-to-web imports. No runtime cycles were found by this scan. The baseline is an explicit migration backlog, not a claim that those boundaries are clean. Do not regenerate it to make a failing change pass. Remove entries as dependencies are corrected; review any additions as architecture changes.

The scanner covers literal TypeScript imports, re-exports and literal dynamic imports. Computed imports and runtime plugin loading require review. New features must follow the boundaries even where older modules are still being migrated.

## Background processes

See [worker operation](../../apps/workers/README.md). `apps/workers/run.mjs` is an independent scheduling/transport process that invokes existing authenticated cron handlers. Domain execution still occurs in the web backend. Notification receipt reconciliation and transaction behavior therefore remain shared with HTTP/manual execution.

Exports retain their existing authenticated workflow; no export queue or new delivery guarantee is introduced by this refactor. A durable export queue needs its own job model, ownership checks, leases, retry policy and acceptance tests before extraction.

## Migration order

1. Use the support feature as a tested reference.
2. Move existing library imports of route actions/queries to owning feature entry points, preserving compatibility re-exports while consumers move.
3. Remove shared packages' imports of web internals through injected adapters or pure shared contracts.
4. Migrate collections, payments and occupancy individually, with ownership, duplicate-submission, ledger and transaction regressions.
5. Extract durable job execution only when retries and recovery have an explicit design.

This change establishes and enforces the pattern. It does not rewrite every existing feature or remove the documented legacy backlog.
