# Responsive visual audit — 8 October 2026

Checked the local production build in Google Chrome at 320×568, 390×844, 430×932, 768×1024, 1280×800 and 1920×1080. These are simulated browser viewports, not physical devices or Safari/Firefox coverage.

## Findings

1. **Laptop login presentation is broken.** At 1280×800, the left operations showcase has insufficient space: the heading splits words, card labels become vertical, and lower card content overlaps the description and buttons. The login form on the right remains readable. See [screenshot](qa/responsive-2026-10-08/laptop-login.png).
2. **Caretaker metrics are unreadable on a narrow phone.** The 320px dashboard component fixture squeezes metric text alongside icons, wrapping descriptions into very narrow columns. Tenant rent also splits `Ksh 25,000` across lines. No horizontal overflow occurs, so existing overflow assertions pass despite the visual defects. See [dashboard samples](qa/responsive-2026-10-08/phone-dashboard-samples.png).
3. **Public mobile pages are very long.** At 390px, the homepage screenshot is 15,152px tall and vacancies is 9,772px tall. Numerous supporting sections add scrolling. This is a usability observation rather than a rendering error.
4. **Vacancy browsing is dense on mobile.** Filters occupy most of the initial phone viewport, with results beginning near the bottom. Two-column listing cards leave relatively little room for details.
5. **Tablet login is visually cleaner.** At 768px, the compact centered login layout has readable text and clear controls. See [screenshot](qa/responsive-2026-10-08/tablet-login.png).
6. **Desktop dashboard samples have clear hierarchy.** Hero panels, action buttons and metric rows fit well at 1440px in the inspected dark-theme fixture. See [screenshot](qa/responsive-2026-10-08/desktop-dashboard-samples.png).

## Checks and limits

- Six public routes (`/`, `/login`, `/register`, `/pricing`, `/privacy`, `/vacancies`) across six widths and two themes: 72 layout observations, all HTTP 200, no document horizontal overflow or captured page JavaScript errors.
- Dashboard header fixtures for tenant, organization, caretaker and landlord at 320px, 768px and 1440px in both themes: three tests passed. Visual inspection still found the narrow-phone problem above.
- Full dashboard shells, authenticated data-heavy screens, real device keyboards, iOS Safari and Firefox were not checked. The dashboard screenshots use sample component data.
- No application source was changed. Suggested priority: repair laptop showcase sizing and narrow-phone metric layouts before reducing mobile page density.

## Responsive fixes implemented

The findings above document the original audit. The subsequent authorized changes preserve whole words in shared text styles, let narrow dashboard metric rows stack based on available space, keep metric amounts together, and stack mobile table fields on screens below 420px. The compact login showcase now uses one full-width operations panel with natural height and vertical scrolling when needed.

Updated screenshots: [laptop login](qa/responsive-2026-10-08/after/laptop-login.png), [phone dashboards](qa/responsive-2026-10-08/after/phone-dashboard-samples.png).

Verification after changes: all 72 public page/theme/width observations returned 200 with no document overflow or captured JavaScript errors; 12 dashboard, organization, payments and shared-table fixture tests passed; six fixture tests passed with new assertions for words split across lines; the login regression passed at 1024px, 1280px and 1920px with a 600px viewport height. All 334 unit tests passed. Changed TypeScript files and browser tests passed ESLint. The production build passed with the deployment's `ESTATEDESK_BUILD_WITHOUT_DATABASE=true` flag, including TypeScript and all 820 generated pages.

These fixes do not shorten the public pages. Physical devices, Safari/Firefox and every authenticated data variation still require further coverage.
