# Organization management and recruitment verification

Implemented in the working tree on 10 November 2026. This record concerns web features and database workflows; it does not establish a production rollout.

## Delivered

- Organization approval centre for expense decisions, refund authorization, rent changes, charge write-offs and staff membership suspension; source snapshots, independent reviews, monetary limits and transactional audit history.
- Assigned arrears promises, payment progress, broken-promise detection, follow-up dates and recorded outcomes.
- 30/60/90-day lease renewal lists, proposed rent/term notices, actual tenant portal responses and administrator finalization.
- Searchable org-scoped audit summaries, assignment handovers/coverage and property comparisons with rental collection, paid/maintenance costs, net rental contribution and current occupancy/vacancy/arrears.
- Platform and organization recruitment, public employer/poster identity, draft/published/closed lifecycle, searchable public careers, anonymous application intake, private optional PDF CVs, applicant pipeline, interview records, review history and administrator deletion.
- Web navigation, careers discovery/sitemap, role/view policy integration and organization purge coverage. Web-only additions are explicitly excluded from native menus so native clients do not advertise unsupported controls.

## Database evidence

Both additive migrations were deployed to a newly created, explicitly disposable local `estatedesk_management_test` database. All 93 repository migrations were applied there. No production database mutation was performed. The two new migrations create eight tables and their ownership/index constraints; they contain no table drops or data-deletion statements.

The final database check connected successfully, matched the generated client schema with no missing columns, and reported no pending, modified or unfinished migrations in this local database.

Integration checks use the existing loopback/test-name safety guard and clean fictional records. The finance fixture uses the dependency-aware organization purge routine after testing accounting journals.

The final integration run passes **21 tests**, including organization/scope isolation, independent approval, stale-request rejection, reviewer limits, expense-author rejection, balanced accrued write-off posting, closed-period rollback, refund authorization without fake money movement, payment-backed promise fulfilment, tenant-only renewal acceptance, handover return behavior, property aggregates and staff session revocation. Recruitment checks cover draft privacy, platform/org separation, public attribution, consent, duplicate submissions, private PDF ownership, stale reviews, valid interview stages, suspension/expiration/closure and applicant/CV removal.

## Browser evidence

The signed-in Playwright workflow passed in the installed Google Chrome against the same disposable database. It rendered all six management routes, created an organization job through the actual form, published it, opened its public page at a 390px viewport, submitted an anonymous application with a PDF, rejected anonymous CV access, downloaded the CV as the employer, changed the applicant to screening and verified platform hiring did not list the organization's job. No outbound email or native push was enabled.

The browser fixture uses an HTTP development origin and test-only sessions; this is not a production secure-cookie transport test. The initial browser attempts exposed test-environment issues (missing bundled browser, the normal product-update dialog and a label selector). The passing run used system Chrome and the accessible combobox role. Native binaries were not changed.

## Regression checks

- New policy tests and targeted role, navigation, retention, SEO and semantic-icon tests pass.
- Targeted ESLint checks pass.
- Web TypeScript checks pass; the production build performs another full check.
- Full root unit runner: **204 passing files, 16 failing files**. The failing filenames exactly match the 16 failures recorded in the pre-change review; there are no newly failing files after the native-menu and semantic-icon fixes. This is not an all-green repository test suite.
- Final production build passed: compilation, full TypeScript, generation of 882 pages and build tracing completed. The web artifact was recorded for workflow protocol 1 and its fingerprint matches the final source. The build used the existing database-free build option and made no live database changes.

## Live migration status

The configured live database connection was retried with network permission and returned `ETIMEDOUT`. No live backup or migration could be performed. The new migrations remain to be applied to that database before deploying matching code:

1. `20261110170000_org_management_workflows`
2. `20261110180000_public_recruitment`

Migration authorization was already provided by the user. Connectivity, rather than a missing approval, prevents completion. These local tests and bundles must not be described as a live deployment.

Workflow references: [Organization management](../../ORG_MANAGEMENT.md), [Recruitment](../../RECRUITMENT.md).
