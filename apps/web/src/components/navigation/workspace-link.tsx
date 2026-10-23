"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { directoryContext, directoryReturn } from "@/lib/navigation/return-context";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { canDiscoverWorkspaceHref, type canAccessWorkspacePath } from "@/lib/permissions/workspace-access";

type Access = Parameters<typeof canAccessWorkspacePath>[0] & { userId?: string };
const WorkspaceAccessContext = createContext<Access | null>(null);

export function useWorkspaceAccess() { return useContext(WorkspaceAccessContext); }

export function WorkspaceAccessProvider({ access, children }: { access: Access; children: ReactNode }) {
  return <WorkspaceAccessContext.Provider value={access}>{children}</WorkspaceAccessContext.Provider>;
}

/** Restricted destinations are omitted, including labels and route prefetching. */
export default function WorkspaceLink(props: ComponentProps<typeof NextLink>) {
  const router = useRouter();
  const access = useContext(WorkspaceAccessContext);
  const href = typeof props.href === "string" ? props.href : props.href.pathname ?? "";
  if (access && !canDiscoverWorkspaceHref(access, href)) return null;
  return <NextLink {...props} onClick={event => {
    props.onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
    try {
      const target = new URL(typeof props.href === "string" ? props.href : href, window.location.origin);
      if (target.origin !== window.location.origin) return;
      const path = window.location.pathname;
      if (!access?.userId) return;
      const scope = `${access.userId}:${access.activeOrgId ?? "platform"}`;
      const key = `estatedesk.directory:${scope}:${target.pathname}`;
      if (target.pathname.startsWith(`${path}/`)) sessionStorage.setItem(`estatedesk.directory:${scope}:${path}`, directoryContext(path, window.location.search));
      const restored = directoryReturn(path, `${target.pathname}${target.search}${target.hash}`, sessionStorage.getItem(key));
      if (restored) { event.preventDefault(); router.push(restored); }
    } catch { /* Navigation remains usable when browser storage is unavailable. */ }
  }} />;
}
