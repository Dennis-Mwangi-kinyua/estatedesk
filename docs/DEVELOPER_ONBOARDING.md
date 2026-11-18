# Developer onboarding

Commands below run from the repository root unless stated otherwise. Reviewed against repository scripts on 18 November 2026.

## Prerequisites

Use Node.js 24.3 or newer, npm with workspace support, Git, and a PostgreSQL database dedicated to development. Native builds need the additional platform tools described in the mobile and desktop READMEs.

## Configure the environment

```bash
cp .env.example .env
```

Edit `.env` before continuing. Set `DATABASE_URL` to your development database and `DIRECT_URL` to its migration connection. Prisma CLI configuration prefers `DIRECT_URL` over `DATABASE_URL`. Set both application URLs to `http://localhost:3000` and replace secret placeholders with independently generated values:

```bash
openssl rand -base64 48
openssl rand -base64 32
```

Use the 32-byte command for `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`. See the [environment reference](ENVIRONMENT.md) for integration settings.

The CLI reads the root `.env` through `prisma.config.ts`; Next.js runs from `apps/web`. Make the same development environment available there. On Linux/macOS, if `apps/web/.env` does not already exist:

```bash
ln -s ../../.env apps/web/.env
```

Alternatively, maintain an `apps/web/.env.local` with the same necessary values. Avoid conflicting definitions between files. Never commit secrets or point development commands at a production database.

## Install and initialize

```bash
npm ci
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npm run dev
```

Installation also generates the Prisma client through `postinstall`. Migration deployment applies committed migrations; it does not create a new migration. Open `http://localhost:3000`. Optional `npm run seed` writes seed data; inspect `prisma/seed.ts` and use only an appropriate development database.

## Find the implementation

| Concern | Location |
| --- | --- |
| Browser pages, route handlers and layouts | `apps/web/src/app` |
| Feature workflows and actions | `apps/web/src/features` |
| Authentication, billing and shared domain logic | `apps/web/src/lib` |
| Shared browser components | `apps/web/src/components` |
| Native mobile client | `apps/mobile` |
| Desktop client | `apps/desktop` |
| Shared libraries and contracts | `packages` |
| Domain package boundaries | `services` |
| Database models and migration history | `prisma` |
| Automated checks | `tests` |

Make product changes in `apps/web/src`, even when your editor has a similarly named root `src` file open. Follow existing permission guards and scope organization data by authorized membership and organization. Read [contribution conventions](CONTRIBUTING.md) before introducing a dashboard route.

## Verify changes

| Command | Purpose |
| --- | --- |
| `npm run lint` | Web lint checks |
| `npm run typecheck` | Web TypeScript checks |
| `npm test` | Root test suite |
| `npm run test:integration` | Integration suite; inspect fixtures and database requirements first |
| `npm run test:e2e` | Playwright browser tests; consult the root Playwright configuration |
| `npm run build` | Generate Prisma client and build the web release artifact |
| `npm run start` | Serve the built web application |
| `npm run mobile:typecheck` | Mobile TypeScript checks |
| `npm run desktop:test` | Desktop tests |

Run checks appropriate to the changed behavior. A successful build does not establish provider integration, device compatibility, or production readiness. Record those checks separately with their environment and date.

## Troubleshooting

- **Missing environment values:** verify both root CLI and web workspace environment files, then restart the development server.
- **Database connection failure:** check that PostgreSQL is reachable and both connection URLs select the intended database. Inspect `prisma.config.ts` and `apps/web/src/lib/prisma.ts` for CLI/runtime differences.
- **Missing tables or generated models:** check migration status and regenerate Prisma after schema changes. Do not reset a shared database to resolve a local problem.
- **Port already occupied:** pass an alternate port with `npm run dev -- --port 3001` and align local application URLs.
- **Uploads, messaging or payments unavailable:** configure the relevant provider using the environment reference and domain guide; server startup alone does not configure integrations.

Deployment, backup, restore, and incident procedures live in the [operations runbook](OPERATIONS.md). Start further reading from the [documentation index](README.md).
