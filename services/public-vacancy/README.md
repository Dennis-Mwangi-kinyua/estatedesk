# @estatedesk/public-vacancy

Public vacancy listings, SEO sitemaps, and slug resolution.

## Phase 1

Runs **in-process** inside `@estatedesk/web` as a library package. Implementation lives in `src/`.

## Phase 2+

Extract as a standalone HTTP service with its own read model / database ownership.

## Public API (library)

- Cache tags / revalidation
- Listing queries
- Slug resolve
- Sitemap builders
