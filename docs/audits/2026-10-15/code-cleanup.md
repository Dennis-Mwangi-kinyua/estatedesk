# Code cleanup and targeted security improvements

## Changes

- Removed 84 unused imports from 24 source files, unused organization-detail helpers, and unused issue-filter calculations.
- Removed the extra organization-directory shortcut strip and its unused dashboard action definitions. Global Search and Onboarding remain in platform navigation.
- Consolidated notification acknowledgement requests into one browser helper, preserving request timeouts, success events, and navigation during slow or failed acknowledgement.
- Applied the existing notification URL policy to stored URLs, API responses, and notification button links. Protocol-relative URLs, backslashes, control characters, and encoded separators are rejected before navigation.
- Limited notification-read JSON bodies to 1 KiB, including streamed bodies, and strictly validated either a nonempty notification ID or an explicit mark-all target. Authentication, origin checks, and record-ownership enforcement remain in place.
- Grouped routes by their existing cache-header policies, reducing repeated configuration while preserving route coverage.
- Removed an unused rate-limit-bucket count query from the platform control page.

## Verification and limits

- TypeScript passes.
- Unit tests: 454 pass, including notification navigation, unsafe stored links, malformed acknowledgement payloads, oversized requests, and cross-origin rejection.
- Lint: zero errors; warnings reduced from 115 to 22. Remaining warnings include service-worker helpers, unused declarations, raw images, and an unused PDF expression.
- Production build uses the repository's explicit `ESTATEDESK_BUILD_WITHOUT_DATABASE=true` mode. This validates compilation and prerendering without validating live vacancy data or database connectivity.
- The production dependency audit could not resolve `registry.npmjs.org`, including after a retry with network permission. Dependency vulnerability status is unverified in this run.
- No authenticated browser suite, database integration suite, penetration test, or before/after runtime benchmark was performed. These changes do not establish that the entire system is fully optimized or free of security flaws.
- The pre-existing edit to `scripts/extract-page-parts.mjs` was preserved.
