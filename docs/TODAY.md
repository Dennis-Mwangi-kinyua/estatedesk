# Personal Today workspace

Open `/dashboard/today` on the web or **Today · my work and messages** in the native app. Web header shortcuts and navigation entries lead to the same page. On very small screens, use navigation so the profile and menu controls remain usable.

## What is available

- **Everything, Overdue, My tasks and Messages:** views over the same authorized source records.
- **Assigned follow-ups and demos:** incomplete CRM activities assigned to the current user. Organization CRM respects the customer's property/building/unit scope. Platform follow-ups appear in platform context when no organization is selected.
- **Unread personal messages:** current-organization messages for the actual recipient, with an explicit mark-as-read action. Fetching Today or opening a workspace does not acknowledge messages or complete tasks.
- **Tenant payments:** current tenant invoice balances and due dates from the existing billing service, with the same active-lease and section restrictions as current bills. Calendar-date bills remain due today until the end of their Nairobi due day; timed follow-ups become overdue at their appointment time.
- **Maintenance:** tenants see their own reported open requests; caretakers see their assigned unit work within their membership scope.
- **Team queues:** organization-wide members see only the operational and review categories their role and section permissions allow. Team queues are distinguished from personally assigned follow-ups. Platform operators in platform context see permitted platform reviews.
- **Other workspaces:** landlords can open assigned portfolios; security users can open gate activity. Both can read their own enabled personal messages. Active providers see only their own assigned/in-progress/submitted jobs and descriptions. Provider job summaries are read-only in native; full provider job updates remain in the existing web provider workspace.

The native view uses React Native controls and existing native destinations. It does not embed or fall back to a browser. When a native mutation is unavailable, a summary does not invent a working action button.

## Reliability and permissions

The web and native transports share `features/today/service.ts` and the `TodaySummary` contract. `/api/mobile/today` requires a native request and a valid live session and returns `Cache-Control: no-store`. Account setup, organization status and maintenance gates remain enforced by the existing guards. Query parameters cannot select a different user or organization.

Each category returns at most 25 records and indicates when more work is available in its source workspace. Refresh obtains current data. Native failures keep the last successfully loaded data visible with an explicit warning; authentication failures use the existing sign-in recovery. Native drafts remain managed by the existing user/workspace-scoped stores rather than a second Today storage mechanism.

Notification acknowledgements check the exact public origin, scheme and port, including trusted reverse-proxy forwarding, reject cross-site browser requests, and then apply the existing personal-recipient scope. Deployment proxies must overwrite untrusted forwarded headers. Acknowledgements never mark another user's message read.

All displayed dates use Africa/Nairobi. Today adds no tables or migrations and creates no duplicate tasks, bills, notifications or approval records.

## Development checks

Unit checks cover Nairobi boundaries, date-only bills, role access, native-only navigation, and browser-origin protection. Disposable-database scenarios cover user/organization/property isolation, read-only retrieval, active-lease gates, tenant bill/request ownership, provider job ownership and shared response validation. Browser scenarios cover native API parity, small-phone/tablet layouts, overdue/message filters, profile/menu visibility, cross-site rejection, recipient isolation and actual read acknowledgement.

Build and test outcomes are recorded in the development audit. JavaScript exports and browser/native-HTTP tests do not substitute for installed iOS/Android device checks.
