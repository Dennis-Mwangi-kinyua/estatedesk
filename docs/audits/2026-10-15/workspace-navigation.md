# Workspace navigation and entry points

The user selected role-specific work areas as the default first page after login.

| Account | Default destination |
| --- | --- |
| Organization administrator / manager | Organization overview |
| Office staff | Tenants |
| Accountant | Accounting |
| Caretaker | Today's Work |
| Security staff | Gate access |
| Tenant | Tenant overview, including the existing no-active-lease state |
| Landlord | Landlord overview |
| Platform administrator / super administrator | Platform overview, or Developer Home when the existing developer preference is selected |
| Provider-only account | Provider portal |

Login, dashboard entry, invitation acceptance, and password-change completion use the shared role-home policy. Valid requested return destinations and required password/terms steps retain their existing precedence. A historical tenant profile does not override an active staff role, and active roles without organization context are rejected.

## Navigation

Organization, tenant, caretaker, landlord, and platform navigation use shared section rendering and explicit route ordering. Empty sections are omitted, new unclassified routes remain available in a fallback section, and existing permission and active-lease filters run before grouping. Finance, portfolio, daily operations, communication, and account tools are separated by purpose.

Desktop and mobile caretaker links and platform links share their rendering and filtering. Organization mobile priorities use route identifiers instead of labels and lead with the relevant office/accounting work. Gate access appears in both caretaker menus. Nested navigation highlights only the most specific matching destination; landlord overview no longer stays active on statements or anchored portfolio sections.

Platform links prefetch on intent rather than eagerly prefetching every sidebar destination. Landlord desktop navigation scrolls independently above the help/logout footer. Caretaker and platform mobile drawers reuse the shared focus trap, Escape handling, scroll locking, and desktop-resize behavior.

## Server work

Organization summary reads are shared with React `cache` within a single server request across parent layouts, organization guards, and child layouts. There is no persistent cross-request authorization cache. Organization existence, status, and deletion checks remain in the guard. The organization shell uses the authenticated session's active role instead of querying another membership just to obtain a display label. Independent organization shell reads now run together. Password-change completion skips provider lookup for accounts already routed by an organization or platform role.

## Verification

- 458 unit tests pass, including all role homes, missing organization context, platform mode preference, provider fallback, authorization of home destinations, navigation completeness, and nested/hash active states.
- Eight desktop/mobile browser cases pass across navigation, role overviews, tenant layout, and workspace consistency. Navigation fixtures exercise role visibility, lease filtering, active destinations, mobile dock priorities, keyboard dismissal/focus restoration, search, and light/dark rendering. These are component fixtures, not live authenticated database sessions.
- TypeScript and production build pass. Build validation uses `ESTATEDESK_BUILD_WITHOUT_DATABASE=true`; live data paths and database integrations were not exercised.
- Lint has no errors and 22 remaining warnings.
- Two existing visual tests now wait for document readiness instead of indefinite background network silence.
- Production latency and bundle-size improvements have not been benchmarked. The earlier dependency audit remains unavailable due to registry DNS failure. These changes do not establish complete system security or optimization.
