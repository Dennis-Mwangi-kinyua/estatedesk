import Link from "next/link";
import { panelShellClassName } from "./member-detail-ui";
import { getMemberDetailGuidance } from "../_lib/constants";
import type { MemberDetailWorkspaceProps } from "./member-detail-workspace";

export function MemberDetailGuidance({
  member,
  meta,
  normalizedRole,
}: MemberDetailWorkspaceProps) {
  const roleSlug = normalizedRole.toLowerCase();
  const guidance = getMemberDetailGuidance(
    normalizedRole,
    roleSlug,
    member.id,
  );

  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Profile actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Manage {member.user.fullName}&apos;s {meta.label.toLowerCase()} record,
          assignments, and employment status.
        </p>

        <div className="mt-4 space-y-3">
          {guidance.map((item) => (
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
    </aside>
  );
}