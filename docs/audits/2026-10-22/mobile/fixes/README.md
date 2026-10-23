# Public mobile corrections — local verification

These changes address the confirmed mobile findings and shared public CTA consistency. They have not been deployed.

- Mobile navigation uses native `details`/`summary` instead of a disabled button waiting for hydration. Links work with JavaScript disabled. Hydrated navigation adds the overlay, close control, focus trap, Escape handling, focus return and desktop-resize dismissal.
- Removed the root workspace loading boundary, which left public content behind a loading fallback with JavaScript disabled. The existing `(app)/loading.tsx` still supplies the authenticated workspace loading UI.
- Extended the existing 16px text/44px minimum form control sizing rule through 1279px, excluding native radio, checkbox and other non-text inputs.
- Shared solid public CTA classes now cover homepage, regional landing CTAs, plan selection and pricing CTAs, services CTAs, sales submission and header access CTAs. Primary/secondary colors follow the active brand palette. Focus, hover, active, disabled styling and reduced-motion behavior are defined together. No gradients were added.
- Enlarged standalone recovery/account links, guide back link, regional market links, vacancy discovery link, provider-name/pagination links and footer navigation targets. Native checkbox/radio targets and inline prose links are not blindly enlarged.
- Replaced public status configuration instructions with a support link; explicitly states that the page does not show live monitoring. Informational cards no longer use success-check icons that could imply a live health result.

## Verification

`tests/e2e/public-mobile-navigation.spec.ts`: four Chromium mobile regression tests passed. Covers JavaScript-disabled navigation, hydrated keyboard focus and desktop resize, tablet text fields on six routes, and shared actions/overflow at 360/390/768px across five public templates in both themes. Theme checks remove the previous theme class before applying the next one.

25 focused unit tests passed (SEO, robots, sitemap, rental SEO and accessibility baseline). Web TypeScript and targeted ESLint passed.

Local mobile captures and computed action colors/dimensions are included. Home dark, pricing light and regional dark screenshots were visually inspected. Captures may include the Next.js development indicator; it is not site content.

The local Next.js development command reported a dependency security advisory; dependency remediation is separate from these public UI corrections.

## Remaining limits

The native-menu fallback removes the dependency on hydration for opening/navigation; it does not prove the original intermittent deployed hydration delay itself is eliminated. Verify again after deployment and profile failed/slow chunks if it recurs.

Real-device Safari focus zoom, screen readers, contrast certification, authenticated workflows, form submission, webmaster accounts, legal sign-off and operational monitoring configuration remain outside this local verification. There is no claim of complete site-wide mobile or accessibility sign-off.
