import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import { SUPPORT_GUIDANCE } from "../_lib/constants";
import { panelShellClassName } from "./support-ui";

export function SupportGuidance() {
  return (
    <WorkspaceGuidePanel
      title="Before you send"
      description="Clear subjects and concrete details help platform administrators respond faster."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Before you send</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Clear subjects and concrete details help platform administrators respond
          faster.
        </p>

        <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
          <li>Include affected user emails or roles for access issues.</li>
          <li>Add billing period or invoice references for payment questions.</li>
          <li>Paste error messages and timestamps for technical problems.</li>
        </ul>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Related workspaces</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Some requests can be resolved faster from the relevant organization desk.
        </p>

        <div className="mt-4 space-y-3">
          {SUPPORT_GUIDANCE.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-3 inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
              >
                {item.actionLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}