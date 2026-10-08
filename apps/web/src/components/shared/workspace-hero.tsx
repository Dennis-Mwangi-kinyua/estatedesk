import type { ReactNode } from "react";
import { VisualSticker } from "./visual-sticker";

export type WorkspaceKind = "tenant" | "org" | "caretaker" | "landlord" | "platform" | "payments";


export function WorkspaceHero({ kind, eyebrow, title, description, actions, children, className = "" }: {
  kind: WorkspaceKind; eyebrow: string; title: ReactNode; description: ReactNode; actions?: ReactNode;
  children?: ReactNode; className?: string;
}) {
  return <header className={`workspace-hero ${className}`} data-kind={kind}>
    <div className="workspace-hero__layout">
      <div className="min-w-0"><p className="workspace-hero__eyebrow"><VisualSticker label={eyebrow} size="xs" />{eyebrow}</p><h1 className="workspace-hero__title">{title}</h1><div className="workspace-hero__description">{description}</div>{children && <div className="workspace-hero__details">{children}</div>}</div>
      <div className="workspace-hero__side"><div className="workspace-hero__art" aria-hidden="true"><VisualSticker label={kind === "org" ? "organisation" : kind} size="lg" /><VisualSticker label={kind === "caretaker" ? "inspection" : "reports"} size="lg" /></div>{actions && <div className="workspace-hero__actions">{actions}</div>}</div>
    </div>
  </header>;
}
