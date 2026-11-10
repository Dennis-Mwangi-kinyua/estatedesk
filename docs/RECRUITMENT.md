# Recruitment

Recruitment manages employee hiring separately from the existing contractor/service-provider marketplace.

## Entry points

- `/platform/recruitment`: EstateDesk platform job drafts, publishing and applications; platform admins and super-admins.
- `/dashboard/org/recruitment`: organization hiring; active organization-wide admins and managers, subject to recruitment view/plan restrictions and explicit staff-management denial.
- `/careers`: public searchable jobs, including employer filters.
- `/careers/[slug]`: the published role, employer, actual poster name, employment/workplace type, location, requirements, optional salary range, deadline and application form.

Platform hiring owns jobs with `orgId = null`. Organization hiring owns jobs with the current session's orgId. Neither listing nor applicant/CV access implicitly combines these scopes. The server chooses ownership from the authorized session; an employer cannot submit an arbitrary organization ID or claim to post as EstateDesk.

## Publishing

Create a private draft, review its details, then publish it. Published jobs accept applications until the end of their Nairobi closing date. Draft, closed, expired and suspended/deleted-employer jobs are excluded from public discovery and application intake. Closing/unpublishing preserves existing applications and history. Update and publishing operations check updatedAt to reject stale edits. Public listings expose the employer and poster name but never account IDs, applicant data, reviewer notes, CVs or private contact details.

Each job has a stable unique public slug. Careers is linked from public navigation, footer and the public index. `/sitemap-careers.xml` includes currently open jobs. Internal hiring workspaces remain under protected noindex areas.

## Applying

Visitors can apply without an account. Required fields are name, email, phone, cover letter and explicit consent to share the application with the identified employer. A portfolio URL and PDF CV are optional. Email is normalized and unique per job. Duplicate submissions receive a generic acknowledgement and cannot overwrite or reveal the previous submission. Public intake uses a honeypot plus separate IP/email rate limits; email limiter keys are hashed. IP extraction respects the configured trusted proxy policy.

CVs are limited to **1MB**, PDF MIME type and PDF signature bytes. They are stored as private PostgreSQL bytes on the application record. This provides transactional persistence and deletion without a new storage-account dependency. Listing and review queries explicitly exclude the bytes; only authorized downloads read them. Database capacity and private backup retention must account for attachment volume. No public file URL is generated.

Successful submission means the application was stored, or an existing submission for that job/email was acknowledged. It does not claim delivery of an email receipt. Organization job authors receive an in-app notification; both hiring dashboards show actual application totals.

## Reviewing

Search and paginate applicants, filter stages, read the cover letter, open the portfolio, download the private CV, and record internal reviews. The pipeline is submitted → screening/shortlist → interview → offer → hired, with rejection/withdrawal paths and restricted transitions. Hiring directly from submitted is blocked. Each review is checked against its current version and records reviewer, previous/new stage, note and optional interview appointment.

Interview appointments are recorded in Nairobi time; they must be future valid dates. Appointment entry and review notes are internal. This feature does not send interview invitations or offer letters; reviewers contact applicants separately.

CV downloads use `/api/recruitment/{platform|organization}/applications/[id]/resume`, require the appropriate current authorization and return attachment, no-store, nosniff, sandbox and noindex headers. Cross-employer access is rejected.

Administrators can permanently delete an application, CV and review history with a reason and explicit typed confirmation. An audit event records the deletion without retaining applicant content. Organization deletion cascades through its jobs, applicants and reviews; platform jobs are not removed with an organization.

## Rollout and verification

Apply `20261110180000_public_recruitment` after the organization-management migration before deploying matching code. Tests cover public eligibility, scope separation, consent, duplicate handling, CV access, reviewer concurrency, stage transitions, employer suspension, closure and applicant removal. New native recruitment screens are not included; the public and private web pages support mobile browsers.
