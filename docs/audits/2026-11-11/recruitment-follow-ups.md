# Recruitment follow-ups and reports

Delivery: GitHub only. No production migration, deployment, scheduler activation or real email dispatch was performed.

## Candidate communication

New applications receive one queued email receipt containing a stable `ED-…` application reference. Duplicate submissions keep the generic public acknowledgement, do not overwrite the original application and do not send a second receipt. References are visible to the employer; no public reference lookup exposes candidate records.

Shortlist, interview, offer and rejection reviews create private message drafts. An authorized employer reviews the recipient, subject and editable body before approving. Review notes are excluded from templates. Interview reviews require an appointment in Nairobi time plus location/meeting and hiring-contact details. The approved invitation schedules a reminder roughly 24 hours before that appointment if the reminder is still in the future. Reminders repeat the approved invitation text and wait until the invitation has been accepted by the email provider. A short-notice interview receives its invitation without an immediate duplicate reminder.

Changing a review cancels older pending drafts, approved messages and reminders. Approval checks both the message version and candidate version. Delivery checks the employer's active/not-deleted/not-blacklisted status, candidate version, stage and current interview event before handoff. Work already handed to the email provider cannot be recalled.

Communication histories show recent drafts, queued messages, approval times, scheduling, attempts, provider acceptance, failures and cancellations. `ACCEPTED` means accepted by the email provider, not inbox delivery or opening. The outbox contains no CVs. Deleting an application cascades through its events and communications.

## Employer reminders

An open advertisement within 48 hours of closing queues one reminder per deadline to its original poster's email, when that account has an email. Closed, expired, suspended or blacklisted employer advertisements do not send closing reminders. Deadline changes invalidate pending reminders for the previous deadline. The job workspace shows recent hiring-team reminders; the queue fetches up to 100 new deadlines per run without repeatedly selecting those already recorded.

## Delivery worker

`/api/cron/recruitment` requires the existing bearer `CRON_SECRET`; an unset or incorrect secret returns 401. Runs are recorded in `CronJobRun` for platform job monitoring. Each run handles up to 20 due emails; an individual API call has a bounded timeout. Atomic claims prevent concurrent workers from independently claiming a queued message. The worker uses stable provider idempotency keys, crash-lease recovery, bounded exponential retry and a maximum of five delivery attempts. It stops automatic retries after 20 hours from the first delivery attempt to stay within the expected provider idempotency window. Provider ambiguity cannot provide an end-to-end exactly-once guarantee; failure histories instruct the team to confirm delivery before contacting a candidate again.

Email uses the existing transactional email adapter and requires `RESEND_API_KEY` and `EMAIL_FROM` in the deployment secret store. The GitHub workflow `.github/workflows/recruitment.yml` runs on a five-minute schedule only when repository variable `RECRUITMENT_SCHEDULE_ENABLED` is `true`. It uses existing variable `ESTATEDESK_APP_URL` and secret `CRON_SECRET`. GitHub scheduling can be delayed; reminders are dispatched by the next successful run rather than promising minute-exact delivery. High queues may need a more frequent external scheduler or a larger tested worker batch.

## Recruitment reports

The hiring workspace reports applications received in the last 90 days: self-reported application sources, candidates actually reaching each recorded stage, rejection/withdrawal exit events by their previous stage, hires and average days from application receipt to the first hire event. No stage is inferred when an employer skips directly to a later stage. Historic application sources default to unspecified. Source/stage/time metrics use at most the most recent 5,000 applications; the UI discloses when capped and separately shows the full period total. Reports are scoped to platform recruitment or the current employer, using the same access policy as candidate reviews.

## Activation order

1. Apply `20261111180000_recruitment_communications` through the normal production migration process before releasing code that reads these fields. The earlier organization-blacklist migration must also be present. This task applied only the new SQL to a disposable local test database.
2. Deploy the reviewed release and configure the existing transactional email credentials and cron bearer secret.
3. Verify the endpoint's unauthorized response and test authorized delivery with an address you control.
4. Enable `RECRUITMENT_SCHEDULE_ENABLED` after that check. Do not enable it against an older deployment.
5. Monitor platform Jobs & Queues and the applicant communication histories. Closing reminders also appear in each job's hiring-team reminder history.

## Validation

Focused policy/SEO checks, web TypeScript and changed-file ESLint checks. Disposable-database integration verifies scoped reports, receipts, approval/reapproval restrictions, concurrent delivery claims, approved reminders, employer blacklisting, stale-review cancellation, retries and cascaded deletion using an injected fake email sender. Browser coverage exercises public application-source capture, queued receipt creation, private review notes, employer message approval, reports and cron authentication on desktop and phone, without dispatching emails.
