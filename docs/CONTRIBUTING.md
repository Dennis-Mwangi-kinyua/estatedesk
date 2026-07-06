# Contributing

This guide covers how to add or extend EstateDesk dashboard routes without changing RBAC, business flows, or page behavior.

## Page layout convention

Keep each route thin and modular:

```
src/app/(app)/dashboard/org/<feature>/
  page.tsx                 # auth, searchParams, data fetch, render workspace
  _lib/
    queries.ts             # Prisma reads; org-scoped where clauses
    helpers.ts             # formatting, href builders, pure utilities
    types.ts               # PAGE_SIZE, props, inferred query result types
  _components/
    <feature>-workspace.tsx
    <feature>-pagination.tsx   # when the list is paginated
```

Target roughly **250–300 lines per file**. If a module grows past that, split UI into additional `_components/` files.

The canonical paginated org route is **`/dashboard/org/leases`**.

## Adding a paginated org list route

### 1. `page.tsx`

- Mark `dynamic = "force-dynamic"` when data is session-bound.
- Call `requireUserSession()` and redirect when `activeOrgId` is missing.
- Parse `searchParams.page` (default `1`).
- Fetch data from `_lib/queries.ts`.
- Render a single workspace component.

```tsx
import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { FeatureWorkspace } from "./_components/feature-workspace";
import { getOrgFeaturePageData } from "./_lib/queries";
import type { FeaturePageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function FeaturePage({ searchParams }: FeaturePageProps) {
  const session = await requireUserSession();
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!session.activeOrgId) {
    redirect("/dashboard");
  }

  const data = await getOrgFeaturePageData(
    session.activeOrgId,
    Number(resolvedSearchParams.page ?? "1"),
  );

  return <FeatureWorkspace data={data} />;
}
```

### 2. `_lib/types.ts`

- Export `PAGE_SIZE` (usually `20`).
- Define `searchParams` / page props.
- Infer page data from the query function:

```ts
import type { getOrgFeaturePageData } from "./queries";

export const PAGE_SIZE = 20;

export type FeatureSearchParams = { page?: string };

export type FeaturePageProps = {
  searchParams?: Promise<FeatureSearchParams>;
};

export type OrgFeaturePageData = Awaited<ReturnType<typeof getOrgFeaturePageData>>;
```

### 3. `_lib/queries.ts`

- Scope every query with `orgId` (and `deletedAt: null` when the model is soft-deleted).
- Use `getPagination()` from `@/lib/db/pagination` — page size is capped at **100**.
- Run `count` and `findMany` in `Promise.all` when you also need summary stats.
- Return pagination metadata: `currentPage`, `totalPages`, `showingFrom`, `showingTo`.

```ts
import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "./types";

export async function getOrgFeaturePageData(orgId: string, page = 1) {
  const where = { orgId, deletedAt: null };
  const { page: currentPage, skip, take } = getPagination({ page, pageSize: PAGE_SIZE });

  const [total, rows] = await Promise.all([
    prisma.feature.count({ where }),
    prisma.feature.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  return {
    rows,
    total,
    currentPage: safePage,
    totalPages,
    showingFrom: total === 0 ? 0 : skip + 1,
    showingTo: Math.min(skip + rows.length, total),
  };
}
```

### 4. `_lib/helpers.ts`

- Keep helpers pure (no Prisma, no session).
- Add `buildFeaturePageHref(page, filters?)` so pagination and filters stay in sync.

### 5. `_components/*-pagination.tsx`

- Hide the control when everything fits on page 1.
- Use `build*PageHref` for Previous / Next links.
- Show `Showing X–Y of Z` copy consistent with other org lists.

### 6. Error handling in UI

- Log detailed errors server-side with `console.error`.
- Show a **generic** user-facing message in error states — never expose Prisma codes, stack traces, or internal schema details.

## Verification

Before opening a PR:

```bash
npm run typecheck
npm test
```

For new modular routes, add an entry to `tests/unit/module-structure.test.ts` so CI enforces the `_lib/` / `_components/` layout and thin `page.tsx`.

## Security and ops notes

- Request gating, rate limits, and security headers live in `proxy.ts` and run through root `middleware.ts`.
- Shallow `GET /api/health` is public; `GET /api/health?deep=1` requires `Authorization: Bearer <CRON_SECRET>` (same as cron routes).
- Do not change RBAC checks, redirect targets, or server action contracts unless the task explicitly requires it.