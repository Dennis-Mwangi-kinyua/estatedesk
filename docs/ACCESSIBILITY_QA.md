# Accessibility And Mobile QA Evidence

Status: **AUTOMATED BASELINE COMPLETE — MANUAL AUTHENTICATED QA STILL REQUIRED**

Last updated: 2026-07-04

Use this checklist to record evidence before sign-off. Test at **360px**, **390px**, **768px**, and **desktop**. For every workflow record browser, role, viewport, result, screenshot, defect, and retest evidence.

## Automated baseline (CI)

The following checks run in `tests/unit/accessibility-baseline.test.ts`:

| Check | Result | Evidence |
| --- | --- | --- |
| Global `prefers-reduced-motion` handling | Pass | `src/app/globals.css` |
| Skip link + `#main-content` landmark | Pass | `src/components/layout/skip-to-main.tsx`, `src/app/layout.tsx` |
| Login labels, password toggle, alert region | Pass | `src/app/(auth)/login/LoginForm.tsx` |
| Shared button `focus-visible` ring | Pass | `src/components/ui/button.tsx` |
| QA route matrix documented | Pass | This file |

Run locally:

```bash
npm test -- tests/unit/accessibility-baseline.test.ts
```

## Routes to cover (manual)

### Public and auth

- `/`
- `/pricing`
- `/faq`
- `/guides`
- `/login`
- `/register`
- `/forgot-password`

### Organization workspace

- `/dashboard/org`
- `/dashboard/org/payments`
- `/dashboard/org/reports`
- `/dashboard/org/verify-tenant`
- `/dashboard/org/issues`
- `/dashboard/org/units`
- `/dashboard/org/properties/new`
- `/move-outs`

### Tenant workspace

- `/dashboard/tenant`
- `/dashboard/tenant/payments`
- `/dashboard/tenant/water-bills`
- `/dashboard/tenant/issues`
- `/dashboard/tenant/issues/report`

### Caretaker workspace

- `/dashboard/caretaker`
- `/dashboard/caretaker/issues`
- `/dashboard/caretaker/water-bills/read`

### Platform workspace

- `/platform`
- `/platform/users`
- `/platform/organizations`

## Keyboard and screen-reader paths

- Login, password reset, and first-login password change
- Organization dashboard, payments, verification, reversal, and bank import
- Tenant payment submission, bills, receipts, notices, and issue reporting
- Caretaker issue resolution, inspections, and water readings
- Platform organization, user, audit-log, and job administration

## Acceptance criteria

- All controls are reachable and operable by keyboard with visible focus
- Dialogs trap and restore focus; errors are announced and linked to fields
- Headings and landmarks have a logical order; tables have useful headers
- Text and controls meet WCAG 2.2 AA contrast and target-size expectations
- 200% zoom and narrow screens have no lost content or horizontal action traps
- Reduced-motion preferences are respected
- Dark mode and light mode both keep text and controls clearly visible

## Test matrix template

| Route | Role | Viewport | Keyboard | Screen reader | Contrast | Result | Ticket |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` | Public | 390px | Automated labels/focus baseline only | Pending | Pending | Partial |  |
| `/dashboard/org/payments` | Admin | 390px | Pending | Pending | Pending | Pending |  |
| `/dashboard/tenant/payments` | Tenant | 390px | Pending | Pending | Pending | Pending |  |
| `/dashboard/caretaker/issues` | Caretaker | 768px | Pending | Pending | Pending | Pending |  |

## Sign-off

- Tester/date:
- Assistive technology/browser:
- Failed cases and tickets:
- Retest evidence:
- Product owner approval:

When manual QA is complete, update `docs/PRE_LAUNCH_STATUS.md`.