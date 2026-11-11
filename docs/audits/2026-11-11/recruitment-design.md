# Job advertisement workspace and careers design

Recruitment has a dedicated visual identity and navigation, separate from the property service-provider marketplace.

- The public careers board uses an indigo hiring header, employer-first advertisement rows, role/location search, closing dates and application guidance.
- Role details separate responsibilities and requirements from an at-a-glance job summary, with direct application anchors and a private application form.
- Organization and platform hiring workspaces show scoped live/draft advertisement counts, total applications and new applications. Advertisement filters distinguish live, draft, closed and expired roles. Counts describe the whole employer workspace, independently of the selected search/filter.
- Applicant stage cards open filtered candidate lists. Existing review transitions, CV authorization, review history and publishing controls remain in place.
- Navigation labels recruitment as “Job advertisements” under its own hiring group. Public Careers navigation is distinct from service providers. The property service workflow uses service-request wording for its primary heading and creation controls.

Recruitment continues to use `RecruitmentJob` / `RecruitmentApplication`; property service work continues to use `ServiceJob` and provider proposals. No database migration or record conversion is required. No emails are sent by this design change. Recruitment remains web-only where its existing native capability flag excludes it.

Delivery is to the existing GitHub release branch; no deployment or production database mutation.

Validation: focused recruitment policy/SEO, workspace navigation and native route coverage tests; employer-isolation and advertisement-filter integration checks on the disposable local database; desktop and phone browser flows from job draft through publishing, application submission, private CV download and candidate review. Browser screenshots were reviewed for the public jobs board and phone role detail. Web TypeScript and changed-file ESLint checks are included.
