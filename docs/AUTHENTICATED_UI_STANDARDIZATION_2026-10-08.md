# Authenticated UI standardization — 8 October 2026

The authenticated layout now loads a shared action and form stylesheet. Existing workspace buttons and action links adopt the same rounded shape, blue primary palette, outline icons, focus treatment, and minimum 44px touch height. Secondary, destructive, ghost, and link actions retain distinct meanings. The scope follows portalled dialogs while the authenticated layout is mounted.

Mobile page actions fill the available width. Narrow content grids stack, form fields use readable 16px text, and labels wrap between words. Navigation grids and explicitly preserved columns are exempt from the generic stacking rule. Existing hidden controls remain hidden.

Shared navigation, metrics, and page markers use Lucide outline icons. Decorative emoji in authenticated page headings and shared workspace components were replaced. Heading enhancements only add metadata; they do not move React-owned content.

## Coverage and limitations

The shared layout applies across protected pages; this is not a claim that every route was individually exercised. Browser fixtures cover role overviews, organizations, properties, payments, messages, onboarding, account creation, profile pictures, unit and tenant setup, and shared dynamic tables/actions. They run at 320px, 768px, and 1440px with additional organization widths and light/dark assertions. Backend actions are mocked, so these checks do not validate live authentication, payment providers, or persistence.

Physical iOS/Android devices, Safari, and a complete authenticated route walkthrough remain useful follow-up checks. Extremely long unbroken identifiers may need component-specific scroll or truncation behavior.

## Review images

- [Organization at 320px](qa/responsive-2026-10-08/unified/organisation-phone.png)
- [Role overviews on phone](qa/responsive-2026-10-08/unified/roles-phone-light.png)

## Validation

- 45 browser fixture checks passed across phone, tablet, and desktop.
- The final messages fixture loading adjustment passed another three viewport checks without the earlier hydration error.
- 334 unit tests passed.
- Application lint reported zero errors and the existing 115 warnings.
- Production build passed with `ESTATEDESK_BUILD_WITHOUT_DATABASE=true`, including TypeScript validation.
- `git diff --check` passed.

## Next improvements

Prioritize clear empty states, actionable validation messages, fewer steps in mobile navigation, and keyboard/screen-reader checks of dialogs and menus. Production configuration and working email delivery are separate outstanding findings in the site diagnostic report.
