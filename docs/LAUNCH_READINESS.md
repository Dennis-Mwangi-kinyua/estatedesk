# EstateDesk Launch Readiness Checklist

Use this checklist before commercial launch or before onboarding a larger property organization.

## External Uptime And Status

- Choose an external uptime provider such as Better Stack, UptimeRobot, Statuspage, or a comparable provider.
- Monitor `https://your-domain/api/health` every 1-5 minutes.
- Monitor `https://your-domain/api/health?deep=1` every 5-15 minutes.
- Configure escalation rules for:
  - two consecutive deep readiness failures
  - public site outage
  - dashboard login outage
  - failed notification cron
  - repeated database connection failures
- Configure `NEXT_PUBLIC_STATUS_PAGE_URL` to point `/status` users to the public incident page.
- Publish incident updates with impact, affected workflows, mitigation, and resolution time.

## Backups And Recovery

- Enable managed PostgreSQL daily backups.
- Retain daily backups for at least 30 days and weekly backups for at least 90 days in production.
- Run one restore drill before launch.
- Record:
  - restore drill date
  - operator
  - source backup timestamp
  - recovery duration
  - data validation steps
  - issues found
- Enable S3/object-storage versioning or provider-level object recovery where supported.
- Record target RPO and RTO:
  - RPO target: maximum accepted data loss window
  - RTO target: maximum accepted recovery time

## Legal Review

- Have a Kenyan lawyer review:
  - Privacy Policy
  - Terms of Service
  - Security page
  - Data Processing and Retention page
  - customer onboarding contract language
- Confirm how tenant data, payment references, leases, inspection records, and audit logs should be retained.
- Confirm who is data controller and processor for customer organizations.
- Confirm whether additional notices are required for tenants, caretakers, and staff users.

## Accessibility And UX QA

- Run keyboard-only checks for:
  - login
  - organization dashboard
  - imports
  - reports
  - tenant dashboard
  - caretaker dashboard
- Check mobile layouts at 360px, 390px, 768px, and desktop.
- Check form errors for:
  - clear message
  - visible focus
  - no layout overlap
  - recovery action
- Check contrast for primary buttons, destructive actions, badges, table rows, and disabled states.
- Capture screenshots of critical workflows before launch and after major UI changes.

## Import And Reporting Operations

- Run CSV imports in dry-run mode first.
- Download error reports for failed import attempts.
- Confirm committed imports appear in import history.
- Export rent roll, arrears aging, occupancy, owner statement, and water recovery CSVs after the first data migration.
- Keep import/export archives for audit and migration support.
