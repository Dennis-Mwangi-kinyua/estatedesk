"use client";

import NextLink from "next/link";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { canDiscoverWorkspaceHref, type canAccessWorkspacePath } from "@/lib/permissions/workspace-access";

type Access = Parameters<typeof canAccessWorkspacePath>[0];
const WorkspaceAccessContext = createContext<Access | null>(null);

export function WorkspaceAccessProvider({ access, children }: { access: Access; children: ReactNode }) {
  return <WorkspaceAccessContext.Provider value={access}>{children}</WorkspaceAccessContext.Provider>;
}

/** Restricted destinations are omitted, including labels and route prefetching. */
export default function WorkspaceLink(props: ComponentProps<typeof NextLink>) {
  const access = useContext(WorkspaceAccessContext);
  const href = typeof props.href === "string" ? props.href : props.href.pathname ?? "";
  if (access && !canDiscoverWorkspaceHref(access, href)) return null;
  return <NextLink {...props} />;
}
