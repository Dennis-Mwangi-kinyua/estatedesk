import type { ReactNode } from "react";

export type WorkspaceKind = "tenant" | "org" | "caretaker" | "landlord" | "platform" | "payments";


export function WorkspaceHero({ kind, eyebrow, title, description, actions, children, className = "" }: {
  kind: WorkspaceKind; eyebrow: string; title: ReactNode; description: ReactNode; actions?: ReactNode;
  children?: ReactNode; className?: string;
}) {
  return <header className={`workspace-hero ${className}`} data-kind={kind}>
    <div className={actions ? "workspace-hero__layout workspace-hero__layout--actions" : "workspace-hero__layout"}>
      <div className="min-w-0"><p className="workspace-hero__eyebrow">{eyebrow}</p><h1 className="workspace-hero__title">{title}</h1><div className="workspace-hero__description">{description}</div>{children && <div className="workspace-hero__details">{children}</div>}</div>
      {actions ? <div className="workspace-hero__actions">{actions}</div> : null}
    </div>
  </header>;
}
