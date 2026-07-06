"use client";

import { infoPanelClassName } from "../_lib/wizard-ui";

export function WizardSidebar() {
  return (
    <aside className="border-t border-border bg-muted/10 px-5 py-6 sm:px-6 lg:border-l lg:border-t-0">
      <div className="space-y-4">
        <div className={infoPanelClassName}>
          <h3 className="text-sm font-semibold text-foreground">
            Why this setup works
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li>• Keeps long forms focused and easy to complete</li>
            <li>• Reduces input fatigue on mobile</li>
            <li>• Captures unit mix before final creation</li>
            <li>• Gives a final review before submission</li>
          </ul>
        </div>

        <div className={infoPanelClassName}>
          <h3 className="text-sm font-semibold text-foreground">
            Recommended sequence
          </h3>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>1. Add the property profile</p>
            <p>2. Configure water defaults</p>
            <p>3. Add residential or commercial unit mix</p>
            <p>4. Review, confirm, then create</p>
          </div>
        </div>

        <div className={infoPanelClassName}>
          <h3 className="text-sm font-semibold text-foreground">
            Numbering tip
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Prefixes like A, B, SH, OF, or GD help generate clean unit numbers
            such as A01, A02, SH01, and OF01.
          </p>
        </div>
      </div>
    </aside>
  );
}