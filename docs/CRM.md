# EstateDesk CRM

Platform administrators and super administrators use `/platform/crm` for sales and `/platform/crm/customers` for organization relationships. Organization ADMIN, MANAGER and OFFICE staff use `/dashboard/org/crm` for tenant relationships. Both workspaces include Tasks, Reports and communication navigation.

## Sales

Registration/access requests enter the pipeline automatically through the existing OnboardingRequest record; manually entered prospects use the same pipeline. Stages are New, Qualified, Demo scheduled, Proposal, Negotiation, Won and Lost. Assign a platform sales owner, record an expected monthly value and currency, schedule a demo, and link an existing organization when the deal becomes a customer. A scheduled demo creates a follow-up task. Editing the appointment retires its previous follow-up and schedules the replacement; rescheduled appointments are not counted as completed tasks. A won deal requires an organization link; a lost deal requires a reason.

Sales stages are independent of the onboarding review status. Existing onboarding outcomes are backfilled by the migration. Marking a deal won does not change billing or provision a paid subscription. The customer record displays the actual subscription; existing organization/billing screens remain the place to change it.

## Customer information and communication

Customer CRM uses existing organization and tenant records. Their profile links open the established screens for editing contacts, leases, payments and subscriptions. Prospect contacts can be edited in the CRM. Activity histories retain notes, calls, logged emails, tasks and recorded changes.

Personal service messages can be sent to the email on the customer record using the existing `RESEND_API_KEY` and `EMAIL_FROM` settings. Tenant customers with linked portal accounts can also receive in-app messages. CRM records email submission states as Pending, Accepted, Failed or Unconfirmed; Accepted means the provider accepted the request, not confirmed recipient delivery. An unconfirmed submission should be checked in the provider console before another message is sent. Message submission tokens and provider idempotency keys prevent repeated submissions from the same form from sending twice. Each sender is limited to 20 submissions per 15 minutes. The provider request uses the documented [Resend idempotency header](https://resend.com/blog/engineering-idempotency-keys). Opening the phone or email links uses the user's own calling/email application; those external interactions can be recorded in the activity form.

## Tasks and reports

Add dated activities from a prospect or customer record, select an assignee and priority, then use Tasks to view all open, overdue, completed, or assigned-to-me follow-ups. Tasks can be reassigned and rescheduled. Sales demo appointments are rescheduled from the deal details. Completion and edits create history entries.

Reports support 7, 30, 90 and 365 day periods. Activity/completion counts use the selected period. Lead stage/source reports use leads created in that period, classified by their current stage. The win rate is Won / (Won + Lost) for that cohort. Current pipeline values are unweighted monthly estimates grouped by currency. Customer, subscription and open-task totals show the current position. Organization reports include scoped rental-lead status and tenant status.

## Access and rollout

Organization CRM reads and writes are restricted to the active organization. Staff with a property/building/unit scope only see customers with leases in that scope. Customer follow-ups may be assigned to active organization-wide operations staff. Platform records and organization records use different activity targets. Database constraints enforce one activity target and a matching tenant/organization pair.

Apply the checked-in `20261109120000_platform_and_customer_crm` migration using the normal deployment migration process before serving the new routes. Regenerate Prisma Client during the build. No additional environment variables are required. No production database is changed merely by adding these files.

Validation: `npm run typecheck`; targeted ESLint for `src/features/crm` and both CRM route directories; `TSX_TSCONFIG_PATH=apps/web/tsconfig.json node --import tsx --test tests/unit/crm-policy.test.ts tests/unit/workspace-access.test.ts`. The integration test `tests/integration/crm.integration.ts` requires an explicitly configured disposable local `TEST_DATABASE_URL` and the CRM migration applied.

## Native iOS and Android

The native workspace menu now exposes CRM customers, sales leads, tasks, reports and activity history. These use the existing `/api/mobile/workspace/screen` and `/api/mobile/workspace/action` contracts, shared CRM operations and report service. Native organization searches are paginated; deal forms do not require typing database identifiers. Demo and follow-up dates use calendar/time controls and submit timezone-aware timestamps. Native filters cover stages, my prospects, open/overdue/assigned/completed tasks and report periods.

The new native client sends `X-EstateDesk-Forms: 2026-11-09`. Older clients are asked to update before opening the new action schemas. Header negotiation never authorizes a customer or bypasses scope checks. Deployment of the matching backend and a new installed native build remains necessary. Hermes exports and backend tests do not substitute for actual device validation.

The CRM migration was applied to the configured database on 9 November 2026 after a verified private backup. See [cross-platform release evidence](audits/2026-11-09/cross-platform.md). Deployment of the matching backend and native artifacts remains separate.

## Guided demos and trial follow-up

The homepage and Product navigation link to `/register?intent=demo`. This form requests a free 30–45 minute walkthrough using sample data; it does not create credentials or start a subscription. Requests retain referral attribution, use source `DEMO_REQUEST`, and record the selected target plan. Platform Admin → **Demo requests** (`/platform/demos`) is the dedicated inbox, available from the desktop navigation and mobile web navigation. Its cards show contacts, owners, appointments and trial dates, with search and All, New, Unassigned, Scheduled, Trialing and Closed filters. **Manage demo & follow-up** opens the existing CRM record to assign an owner and agree an appointment. Sales CRM also links directly to this inbox. The existing demo scheduling workflow creates the appointment task. A successful request confirms that the team will agree a time; it is not an appointment confirmation.

Only create the customer's workspace when the client is ready to begin. Qualify the onboarding request and use the established organization creation screen. Pro and Plus begin a 14-day trial on workspace creation; Enterprise terms are agreed separately. Organization creation links the prospect to the customer and adds four platform customer CRM tasks, assigned to the administrator creating the workspace: day 3 setup check-in, day 7 progress review, day 12 expiry reminder, and day 14 conversion follow-up. These are staff tasks, not automatically sent customer emails. The existing seven-day payment grace period remains separate from the advertised trial. Record any agreed extension through authorized billing operations; this flow does not grant automatic extensions.

The request form appears before the explanatory content on phones, uses full-width controls with 16px text and stacks plan/account choices. The homepage demo section, CRM cards and navigation adapt from narrow screens. Browser coverage in `tests/e2e/demo-request.spec.ts` checks the demo/free paths and overflow at 320, 390, 768 and 1280 pixels. This coverage concerns the changed demo flow, not a certification of every existing web or native screen.

The native Platform workspace also includes **Demo requests**. It reuses the authorized native CRM cards/actions with a server-enforced `DEMO_REQUEST` source filter, stage and assigned-to-me views, appointment dates, and trial end dates. Deploy the matching backend and rebuild the native app for the updated filter labels and card presentation.
