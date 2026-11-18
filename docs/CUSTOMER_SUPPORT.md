# Customer support

Logged-in users open Help → Contact customer support (`/dashboard/support`). Customers can submit an account, billing, technical or other request, view their paginated request history, open a conversation, reply and mark it resolved. Replying reopens a resolved request. Refresh a conversation to check for new replies; the latest 100 messages are shown. No email delivery, live chat or response-time guarantee is implied.

Platform administrators and super administrators use the same URL as a customer support inbox. Other users, including organization administrators, can access only tickets they created. Ticket IDs never grant access by themselves. All reads and status/reply writes check this boundary. Replies and ticket creation are bounded and rate-limited, require a session and completed account setup, and render as plain text. The initial message is created atomically with its ticket; replies reopen and update their ticket in one transaction.

This inbox handles EstateDesk account/application support. Property repairs and tenancy decisions remain with the property office. The existing organization-wide `/dashboard/org/support` message workflow is retained separately; its historical messages have not been migrated to personal tickets.

Apply `20261118130000_customer_support` before deploying the changed application:

```sh
npx prisma migrate deploy
npx prisma generate
npm run build
```

The migration adds `SupportTicket` and `SupportReply`, indexes and foreign keys. No existing message table is changed. User deletion cascades owned tickets and authored replies. Review retention requirements before enabling any separate permanent account-erasure operation.

Validation includes bounded-input/role policy checks, TypeScript, focused lint and disposable-database tests for ownership, foreign-customer denial, platform inbox access, replies and reopening.

The workflow now uses domain/application/infrastructure layers. Web pages and `/api/mobile/support` share the same application service; ownership, setup, validation and throttling are enforced there. See [architecture](architecture/CLEAN_ARCHITECTURE.md). The native HTTP adapter does not by itself add mobile UI.
