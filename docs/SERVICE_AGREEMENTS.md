# Organization service agreements and DPA

EstateDesk is a product of **Afrisilicon Technology Limited**. The contracting party defaults to “Afrisilicon Technology Limited, trading as EstateDesk”. The privacy/incident email must be entered; no email address, hosting location, subprocessor, certification, or retention promise is invented by the template.

## Workflow

1. Platform administrators open `/platform/agreements`, or follow **Service agreements and DPA** from an organization detail page.
2. Select the organization, enter both legal parties, designate the EstateDesk representative, and complete the privacy contact, service/commercial terms, infrastructure/subprocessor/transfer schedule, and retention/exit schedule.
3. Create and review the unsigned draft. Platform administrators can revise the entire draft before signing.
4. A platform administrator types their authenticated account name, confirms signing authority and consent, and chooses **Sign and send agreement**. This records their signature and sends an in-app notification to active organization administrators. It does not send email or execute an agreement automatically.
5. An organization administrator reviews `/dashboard/org/agreements`, confirms authority and consent, and countersigns. Both parties can download the completed PDF.

The public unsigned template is at `/data-processing-agreement`; its editable Markdown copy is `docs/ESTATEDESK_DATA_PROCESSING_AGREEMENT.md`. Customer schedules and legal review are required before execution. The template is not a statement of ODPC registration or a certification of compliance.

## Integrity and access

- Uses the existing organization-linked `DocumentRecord` and append-only `DocumentEvent` records; no schema migration is required.
- Drafts are visible only to platform administrators. Organization administrators can access only issued/completed agreements belonging to their active organization. Other organization roles cannot sign or download agreements.
- Signatures are authenticated typed-name electronic signatures with explicit consent, user ID, UTC timestamp, document-text SHA-256, and request IP/user-agent evidence. These are not accredited certificate-based signatures.
- Text is immutable once sent. Revisions require a new unsigned agreement. Conditional database updates and transactions reject stale/replayed signing requests and commit signature, status, audit evidence, and delivery records together.
- A restore or backup operation is unrelated to this workflow. Agreement controls never create a real signature without an explicit authorized form submission.
- The SHA-256 covers the exact agreement text, not PDF bytes. PDF signature schedules reproduce the captured signature evidence. Downloads require authorization, verify text integrity, record access events, and use `private, no-store` responses.

## Verification

The authenticated browser regression uses disposable local records and verifies draft privacy, revision, signer-name rejection, delivery URLs, countersigning, replay rejection, cross-organization denial, completed-PDF downloads, and mobile/desktop overflow. It is skipped without the explicit local workspace fixture and test database.
