# Organization plan and theme release — 23 October 2026

The release includes the current working tree, including pre-existing changes.

## Changes

- Platform Admin and Super Admin can configure each organization's plan and property/unit/internal-user limits at `/platform/billing/[orgId]`. Blank capacity means unlimited; zero prevents new additions. Units and BnB listings share capacity. Lowering limits retains existing records.
- Custom accounts have an organization-specific section allowlist. Session policy merges it with role restrictions; it cannot grant a role new permissions. Navigation, direct paths, native API authorization and push notification dispatch use the narrowed policy.
- Saves require platform authorization, confirmation and a current subscription revision; quota writes share the organization lock. Changes preserve unrelated metadata and record audit and plan-transition history. They do not renew or activate subscriptions. Configuration uses existing subscription metadata; no schema migration is required.
- Removed the menu's duplicate theme toggle and the floating global toggle. Existing explicit Light/Dark preference handling remains.
- Open public navigation blurs background sections through tablet widths, including before hydration. Shared action colors are blue in both themes; logout stays red. Overlays remain translucent.

## Validation

- Fresh web TypeScript and production build passed; `git diff --check` passed.
- 646 full-suite tests passed, plus three plan action tests. The focused final policy/action/quota/role suite passed all 13 tests, and plan/theme tests passed all 20 tests.
- Public browser checks passed JavaScript-disabled navigation, tablet field sizing and shared mobile layouts. The original blur assertion incorrectly targeted the wrapper containing the menu; it was corrected to the actual background section, and the menu/focus/Escape/single-toggle scenario passed on rerun.
- Browser computed primary action colors in both Light and Dark: background `rgb(40, 94, 212)`, foreground white.
- Artifact fingerprints match web/mobile sources and all 48 native handlers are present.

## Deployment

Staged deployment: `dpl_WnJt1EejdaHPMkgbkcpN3SiLi7ka`, `estatedesk-h8572o009-dennis-mwangis-projects.vercel.app`.

Rollback target recorded before promotion: `dpl_FzshWTL4eo62q9xkcAXrh2HqfNSD`.

Promoted successfully to production. Inspection confirms `estatedesk.co.ke` points to `dpl_WnJt1EejdaHPMkgbkcpN3SiLi7ka` and reports Ready. Staged health returned `status: ok` and mobile workflow protocol 1.

Post-promotion release checks passed: matching local artifact fingerprints, all 88 applied migration checksums, workflow protocol and 48/48 live mobile routes. Live browser verification at 390px confirms exactly one header theme toggle, background `blur(10px)` with navigation open, Escape dismissal, and blue/white primary actions in both Light and Dark.

`www.estatedesk.co.ke` remains unresolved. Its Cloudoon DNS still needs `CNAME www → e0f913cc4aab26ab.vercel-dns-017.com.` The apex domain remains reachable.

No customer subscription settings are changed merely by deploying the controls. Authenticated production plan edits have not been tested against customer accounts.
