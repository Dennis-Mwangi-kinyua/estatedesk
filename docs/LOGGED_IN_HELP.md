# Logged-in help

Every authenticated workspace exposes a Help link to `/dashboard/help`. The route requires a live user session and inherits the application setup gates and private page metadata.

Organization, tenant, caretaker, landlord and platform accounts see the existing role-scoped guide hub. Security and provider-only accounts see task, security and escalation guidance without receiving another role's guide catalogue.

The hub offers three steps: choose a topic, follow the guide and retry in the selected workspace, then seek support. Organization staff can open the existing support request workflow. Property issues go to the property office; application issues can be escalated through the EstateDesk contact page. Guidance asks for the page, attempted action and error, and tells users to omit passwords, verification codes and payment PINs.

Guide access rules remain enforced on direct article requests. The shared help URL grants no additional business permissions. The Return to my workspace action uses the existing role-aware dashboard redirect.

Validation: logged-in help access covered for organization roles in the personal workspace policy suite; focused ESLint and web TypeScript checks pass. Production build validation is recorded with the release execution.
