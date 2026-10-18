# Tenant, organization and platform mobile dashboards

Source implementation only; no production backend or store binary was deployed.

## Delivered

- Shared dashboard cards, sections, actions, typography, emoji badges and responsive grids. Narrow screens and larger system text use a single column. Search filters locally without extra API requests.
- Tenant summaries render independently, so a slow payment/lease request does not hold back available summaries. Currency formatting is reused across renders. Existing native workflows and exact web destinations remain accessible.
- Organization management dashboards include scoped occupancy metrics, authorized pending payment counts, personal updates, shortcuts and the web's grouped navigation. Native portfolio/payment-review/gate workflows are used where available; other destinations use the in-app web workspace.
- Platform dashboards include organization, user, subscription and operator counts; three recent organizations; searchable administrative and developer tools. No currency aggregation or arbitrary platform financial totals are introduced.
- Dual-role management accounts can switch organization/platform dashboards. Tenant operators retain their tenant home and can open the platform dashboard explicitly.
- Tool menus load independently of aggregate queries. Organization occupancy metrics share one grouped database query. Recent activity is limited to three items. Failures retain working cards and label missing values as unavailable.
- Identical concurrent reads share one network request. Results are not cached after completion; requests with different session cookies are isolated. Mutations clear reuse before and after execution. An old request finishing cannot remove a newer pending read. Mutations are never deduplicated or queued.
- Dashboards refresh after an absence of at least 30 seconds. There is no background polling. Unmounted components ignore pending results; organization/account changes remount the workspace.

## Boundaries

The server reuses the actual web organization/platform navigation and `canAccessWorkspacePath` policy. Organization roles, explicit grants, blocked views and super-admin-only controls apply before menu discovery. Platform role is returned by the authenticated session, and older payloads default to `USER`. A client-selected workspace kind never grants access.

Organization unit counts filter the current organization and membership property/building/unit scope. Pending payment counts reuse the existing scoped review query and require the existing payment-review capability. Organization updates are the current user's own notifications. Platform counts and recent organizations require a live platform operator role.

The new bootstrap accepts only native top-level navigation, validates session/setup/role, and resolves an exact authorized menu destination. It reuses the tenant bootstrap's cookie/HTML response. No cookie appears in a URL or injected script. Web pages and mutations independently enforce their existing authorization and confirmation flows.

New endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/mobile/workspace?kind=organization|platform` | Authorized menu, scoped metrics and bounded recent activity |
| `GET /api/mobile/workspace?kind=organization|platform&section=menu` | Navigation without aggregate queries |
| `GET /api/mobile/workspace/portal?kind=...&path=...` | Role-checked cookie bootstrap into an exact authorized destination |

## Validation

Web/mobile TypeScript and targeted lint passed. All 25 focused unit tests passed, covering role separation, explicit mandates, blocked property views, super-admin controls, exact bootstrap paths, older session defaults, read sharing/retry/invalidation and existing tenant/native cookie boundaries. Both iOS and Android Hermes exports passed. Three browser boundary checks passed for unauthenticated summary/bootstrap requests and ordinary browser API navigation. One authenticated browser-continuation test was skipped because a disposable local test backend was not explicitly selected; real native interaction and visual checks remain outstanding.

Reproduction:

```sh
npm run mobile:typecheck
npm run typecheck
TSX_TSCONFIG_PATH=apps/web/tsconfig.json node --import tsx --test tests/unit/mobile-management-dashboard.test.ts tests/unit/mobile-request-coalescer.test.ts tests/unit/mobile-tenant-workspace.test.ts tests/unit/mobile-api.test.ts tests/unit/mobile-workspaces.test.ts tests/unit/session-cookies.test.ts
npm run test:e2e -- tests/e2e/mobile-tenant-workspace.spec.ts --project=chromium --workers=1
cd apps/mobile
npx expo export --platform ios --platform android --output-dir /private/tmp/estatedesk-role-dashboard-export
```

Deploy the backend/session/proxy changes before installing the updated app. Validate on iOS and Android: management/platform login, dual-role switching, member scope and blocked views, native and web card destinations, refresh after resume, partial/offline failures, search, organization/account switching, large text, VoiceOver/TalkBack and the WebView cookie handoff. JavaScript exports do not establish native-device validation or release readiness.
