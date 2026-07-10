# Deploying the monorepo

## Vercel

1. **Root Directory:** `apps/web`
2. **Install Command:** `cd ../.. && npm install`  
   (or enable “Include source files outside of the Root Directory” and install from repo root)
3. **Build Command:** `cd ../.. && npm run build -w @estatedesk/web`  
   or from `apps/web` with prisma schema path `../../prisma/schema.prisma`
4. **Output:** Next.js default (`.next` under `apps/web`)
5. Env vars: project-level (same as before the monorepo move)

## Local

Keep `.env` at the **repository root** (existing layout). Next.js loads env from `apps/web/`, so either:

- symlink: `ln -sf ../../.env apps/web/.env`, or
- copy/move the file into `apps/web/.env`

```bash
npm install          # repo root
npm run dev          # proxies to @estatedesk/web
npm run build
npm run typecheck
npm test
```

## Prisma

Schema and migrations stay at **repository root** `prisma/` during the transition. `postinstall` and web `build` run `prisma generate` against that schema.
