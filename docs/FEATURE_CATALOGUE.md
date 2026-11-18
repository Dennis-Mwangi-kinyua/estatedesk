# EstateDesk feature catalogue

Reviewed: 17 November 2026. This describes repository implementation, not certification of a production deployment.

The public catalogue is `/features`. Its source is `apps/web/src/lib/product-features.ts`; the page, root SoftwareApplication feature names and `/llms.txt` consume that inventory. Update the inventory when adding or changing a public capability. The catalogue is linked from the homepage, services and public footer, and included in `/sitemap.xml` through `public-site-index.ts`.

| Area | Included workflows | Detailed evidence |
| --- | --- | --- |
| Portfolio | Properties, units, tenants, leases, documents, renewals, move-outs, retained history | `PROJECT_DOCUMENTATION.md`, `MOVE_OUT_RELEASE_VERIFICATION.md` |
| Collections | Arrears, assigned follow-up, promises to pay, payment evidence, paginated rent statements | `COLLECTIONS.md` |
| Payments | M-Pesa and bank payment records, verification and allocation | `PROJECT_DOCUMENTATION.md` |
| Water and fieldwork | Readings, water charges, evidence photos, supported offline queues | `CROSS_PLATFORM_READINESS.md` |
| Finance | Double-entry accounting, AR/AP, budgets, owner distributions, configured tax workflows | `PROJECT_DOCUMENTATION.md` |
| Maintenance | Repairs, service deadlines, inspections, work orders and move-out review | `PROJECT_DOCUMENTATION.md` |
| Community | Time-limited visitor QR passes, gate assignments, notices and acknowledgements | `PROJECT_DOCUMENTATION.md` |
| Short stays | Listing photos, availability, bookings, extensions, expiring guest access | `CROSS_PLATFORM_READINESS.md` |
| Discovery and providers | Rental SEO, provider portfolios, property jobs, hiring, ratings and moderation | `SEO_INDEXING.md`, `PROJECT_DOCUMENTATION.md` |
| Recruitment | Public jobs, applications and authorised follow-ups | `RECRUITMENT.md` |
| CRM | Customers, history, leads, demos, communication, tasks and analytics | `CRM.md` |
| Personal Today | Scoped tasks, messages, bills, maintenance and team queues | `TODAY.md` |
| Imports | Properties/units/tenants, CSV validation, preview, explicit confirmation and history | `CROSS_PLATFORM_READINESS.md` |
| Security and privacy | Password verification, session rotation, device revocation, history and closure review | `SECURITY_CENTRE.md` |
| Access | Role/organisation/property/unit scope, landlord mappings, suspension and restoration | `organization-role-access.md`, `ORG_MANAGEMENT.md` |
| Platforms | Web/PWA, Android/iOS source, Windows/macOS/Linux packaging and desktop smoke check | `CROSS_PLATFORM_READINESS.md` |

Release qualifications must stay visible in marketing. Native CSV currently uses pasted text, not a spreadsheet file picker. Rent statements exclude water, deposits and unapplied cash. Provider acceptance does not establish payment/message delivery. Integrations need owner configuration. Closure requests require review and retention checks. Native device acceptance, signing, store release and packaged desktop acceptance are separate gates.

For older phones, `/basic.html` provides a deliberately small, static overview. It is maintained separately: update it when core product coverage or browser requirements change. It does not provide a legacy dashboard.
