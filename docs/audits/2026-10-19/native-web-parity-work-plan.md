# Full-site native iOS and Android parity

Status: in progress. The app does not use a WebView, but native destination rendering is not the same as full workflow parity. This plan covers public entry points and every signed-in role: organization teams, tenants, landlords, caretakers, security/gate staff, platform administrators, and developers. A destination is complete only when its native screen supports the role's useful read and write workflows with the same authorization, validation, audit, payment, signing, and recovery behavior as the web.

## Implemented in the current pass

- Organization staff permissions: admins can edit additional grants for eligible active managers, office workers, and accountants. The existing web action rechecks admin status and membership, validates grants, requires an audit reason, records the change, and notifies the staff member.
- Tenant administration: native tenant records expose state-appropriate unlink, blacklist, archive, restore, and soft-delete actions. Existing web handlers enforce tenant-management roles, organization ownership, rate limits, lease constraints, audit records, and required reasons.
- Accounting chart of accounts: native account listing, account creation, and account editing reuse existing accounting actions and organization scoping.
- Accounting journals: native journal listing and manual balanced entry form reuse the accounting journal action and engine, including account validation, balanced-line validation, fiscal period rules, and role checks.
- Accounting payables: native forms can add vendors, record paid expenses, and enter approved vendor bills through the existing accounting actions and ledger engine.
- Inventory workflow: native unit lists support scoped editing and deletion; vacant units and buildings can be deleted; authorized users can create units from the native Units page. Existing server actions enforce permissions, property ownership, duplicate prevention, unit limits, vacancy caching, and active/pending lease constraints.
- Vacancy inquiries: authorized organization staff can move native inquiry cards through the web-defined follow-up statuses using the existing role-guarded, organization-scoped, audited action.
- Landlord workspace: landlords now have a dedicated native home and native overview, statement, payout and help destinations. Reads require the signed-in user's active landlord profile; financial rows are scoped to ledger lines attached to that profile.
- Landlord portfolio detail: native property and unit pages show occupancy and current tenancy information only for properties and units in the signed-in landlord profile's active assignments.
- BnB listings: organization listing cards expose audited native pause, publish and archive confirmations. The existing BnB action rechecks role, subscription, listing organization and photo requirements.
- BnB booking operations: listing cards open a native booking workspace with recent reservations and guest requests. The native forms reuse the audited booking, availability, check-in/out, guest-code and request-resolution actions, which recheck role, active subscription, listing ownership, date overlap and booking state. Guest access codes are shown once in the native result and can be shared through the device share sheet.
- BnB guest stay: guests can enter a one-time code in the native app, view their stay and request history, send a rate-limited request to the host, and sign out. The dedicated native guest API validates the same stay window, listing and organization state without using website routes or cookies; guest codes are kept in device secure storage.
- Public vacancies: signed-out users can search native vacancy cards, open native details, and submit native enquiries. The mobile endpoints reuse public-listing filters and the existing inquiry flow’s honeypot, rate limit, availability validation, database transaction and notification delivery.
- Accounting actions are limited to organization-wide Admin, Manager, and Accountant memberships.

## Remaining native workflows

| Area | Current native coverage | Remaining work |
| --- | --- | --- |
| Property, building, unit | Property creation; native unit listing, creation, editing, vacant unit/building deletion | Building creation/editing, full property editing, and remaining inventory controls |
| Tenants and leases | Tenant creation and selected tenant administration; tenant lease views and signing flows | Profile editing, reinstatement/allocation, lease creation and lifecycle administration, deleted-profile recovery |
| Staff | Staff directory and audited additional permission grants | Create/edit/deactivate staff, assignments, and the remaining permission administration flows |
| Accounting | Chart of accounts, manual journal entry, vendor creation, paid expenses, and vendor bill entry | Vendor bill payments, bank reconciliation, periods, budgets, distributions, financial reports/exports, and accounting configuration |
| Imports | Import run history | Native file selection, validation preview, column mapping, confirmation, and error recovery |
| Short stays | Native listing records and audited pause/publish/archive actions; native bookings, date edits, availability settings, check-in/out, cancellation, guest access codes, request resolution and guest stay sign-in/details/requests | Listing creation/editing and secure native photo upload; stay finances and full booking evidence/history comparison |
| Workspace settings | Native settings records | Section-specific read/edit forms and security-sensitive confirmation flows |
| Search and insights | Limited organization/unit search and operational summaries | Full web search coverage and predictive insight workflows |
| Platform API tools | Native endpoint catalog and integration readiness | Native request console with safe credential handling and request/response limits |
| Tenant | Native portal dashboard, payments, documents, lease signing, inspections, maintenance, move-outs, notices, visitors, rewards, profile, security and notifications | Drawn/uploaded lease signatures; complete inspection evidence presentation; compare remaining page details and workflow edge states against web |
| Landlord | Native overview, assigned portfolio and unit details, statements and payouts; security and help destinations | Statement PDF/share, profile, notices and additional web workflows; verify deep links and no-profile recovery |
| Caretaker and gate/security | Native assigned-work, meter, inspection, visitor and gate flows | Compare every web route and action for assignments, emergency/exception states, evidence and offline/retry behavior |
| Platform administration and developer | Native collection pages and selected audited actions | Complete per-page CRUD/review workflows, direct record screens, role-specific controls, and API request execution; many destinations remain read-only summaries |
| Public entry and account lifecycle | Native sign-in, required account setup, terms/privacy reading, password recovery, help, guest stay access, public vacancy discovery/inquiry, and organization-side vacancy inquiry follow-up | Native public registration and onboarding journeys; verify reset-link deep links and expired-session routes |

## Security and release requirements

- Native screens may use web route names only as exact API resource identifiers. They must not open those routes in a browser or WebView.
- Each read must recheck the active session, exact allowed menu entry, role policy, organization, and applicable record/property/building/unit scope.
- Each mutation must recheck authorization and target ownership on the server. Prefer existing web domain actions or services so validation, transactions, audit logs, notifications, and rate limits stay consistent.
- Destructive and financial actions need explicit review/confirmation, idempotency or duplicate protection where the web flow has it, and clear recovery states.
- Type checks do not establish parity or authorization correctness. Finish with role/scope regression checks, disposable-account workflow checks, signed-in iOS and Android device validation, and a coordinated backend/app release.
- Keep the web available as a product surface, but do not send users from the native app to web pages or WebViews. Native app pages need native forms, native confirmation/recovery states, and API/domain operations; route names are identifiers only.

