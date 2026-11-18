# EstateDesk documentation

Start here for development, product workflows, and operations. Reviewed against the repository on 18 November 2026. Dated audits describe evidence from their recorded run; they do not establish current production readiness.

## Start here

| Task | Guide |
| --- | --- |
| Set up a development environment | [Developer onboarding](DEVELOPER_ONBOARDING.md) |
| Understand the product and roles | [Product documentation](PRODUCT_DOCUMENTATION.md) |
| Find supported workflows | [Feature catalogue](FEATURE_CATALOGUE.md) |
| Understand the codebase | [Project documentation](PROJECT_DOCUMENTATION.md) |
| Configure integrations and secrets | [Environment reference](ENVIRONMENT.md) |
| Contribute dashboard features | [Contributing](CONTRIBUTING.md) |

## Architecture and interfaces

- [Feature boundaries and clean architecture](architecture/CLEAN_ARCHITECTURE.md): implemented layers, worker operation, enforcement and remaining migration backlog.

- [Service architecture](architecture/SERVICES.md): current package boundaries and future extraction plans.
- [API reference](API.md): HTTP endpoints; many web mutations use Server Actions instead.
- [Realtime](REALTIME.md): workspace refresh and delivery.
- [Organization role access](organization-role-access.md): permissions and workspace access.
- [Design system](design/visual-system.md): shared visual conventions.

The web application in `apps/web` is the primary backend and browser client. Mobile and desktop clients live in `apps/mobile` and `apps/desktop`. The repository uses a shared PostgreSQL schema. Service directories are not evidence of independently deployed microservices; consult the service map for implementation status.

## Business workflows

- [Customer support](CUSTOMER_SUPPORT.md): private requests, customer conversations and platform inbox.

| Domain | Documentation |
| --- | --- |
| Collections, statements and onboarding | [Collections](COLLECTIONS.md) |
| Approvals, renewals and staff coverage | [Organization management](ORG_MANAGEMENT.md) |
| Prospects and customer follow-ups | [CRM](CRM.md) |
| Hiring and applications | [Recruitment](RECRUITMENT.md) |
| Provider marketplace and identity | [Providers and identity](SERVICE_PROVIDERS_AND_IDENTITY.md) |
| Service agreements | [Service agreements](SERVICE_AGREEMENTS.md) |
| Move-out release checks | [Move-out verification](MOVE_OUT_RELEASE_VERIFICATION.md) |
| Organization deletion | [Deletion workflow](organization-deletion.md) |

## Clients and operations

- [Installable release builds](INSTALLABLE_RELEASES.md): binary formats, cloud build configuration, and acceptance gates.

- [Mobile setup](../apps/mobile/README.md), [desktop setup](../apps/desktop/README.md), and [browser extension](../extensions/estatedesk/README.md).
- [Cross-platform readiness](CROSS_PLATFORM_READINESS.md) and [mobile compatibility](MOBILE_COMPATIBILITY.md).
- [Operations runbook](OPERATIONS.md), [deployment architecture](architecture/DEPLOY.md), and [production deployment checklist](production-deploy-checklist.md).
- [Go-live checklist](GO_LIVE_CHECKLIST.md), [integration readiness](INTEGRATION_READINESS.md), and [restore evidence](RESTORE_DRILL_EVIDENCE.md).
- [Security centre](SECURITY_CENTRE.md), [load testing](LOAD_TESTING.md), and [accessibility QA](ACCESSIBILITY_QA.md).
- [SEO and indexing](SEO_INDEXING.md).

## Maintaining these docs

Update the relevant guide in the same change as behavior, configuration, permissions, or deployment changes. Keep commands aligned with workspace `package.json` scripts and variable names aligned with `.env.example`. Include prerequisites, expected behavior, authorization requirements, failure recovery, and validation where applicable.

Link new guides from this index. Put dated execution results under `audits/` or `qa/`; keep reusable procedures in the topic guides. Separate implemented behavior from planned work and externally blocked release gates. Never include real credentials, customer records, or private callback tokens in examples.
