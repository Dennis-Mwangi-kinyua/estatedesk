import Link from "@/components/navigation/workspace-link";
import { VisualSticker } from "@/components/shared/visual-sticker";
import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import { encodePublicId } from "@/lib/public-id";
import { ArrowUpRight } from "lucide-react";
import { Badge, toneForStatus } from "../../_components/control-plane";
import type { getPlatformUsersPageData } from "../_lib/queries";
import { getInitials } from "../_lib/helpers";
import { PLATFORM_ROLE_META } from "../_lib/constants";

type DirectoryUser = Awaited<ReturnType<typeof getPlatformUsersPageData>>["users"][number];

export function PlatformUserCard({ user }: { user: DirectoryUser }) {
  const orphan = user._count.memberships === 0 && user._count.platformPermissions === 0;
  return <Link href={`/platform/users/${encodeURIComponent(user.slug ?? user.username ?? encodePublicId(user.id, "user"))}`} className="platform-user-card flex h-full min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-primary">
    <div className="flex min-w-0 items-start gap-3">
      <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-xs font-semibold text-foreground">{getInitials(user.fullName)}</span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold leading-5 text-foreground">{user.fullName}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">{user.email ?? user.username ?? "No email"}</p>
      </div>
      <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <VisualSticker label={user.platformRole === "USER" ? "user" : "security"} size="xs" />
      <span className="text-xs font-medium text-foreground">{PLATFORM_ROLE_META[user.platformRole].title}</span>
      <Badge tone={toneForStatus(user.status)}>{user.status.replaceAll("_", " ")}</Badge>
      {user.isRootSuperAdmin && <Badge>Root</Badge>}
      {orphan && <Badge>Orphan</Badge>}
    </div>
    <div className="mt-auto ed-keep-cols grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-3">
      <div className="flex min-w-0 items-center gap-2"><WorkspaceIcon label="organizations" className="h-4 w-4" /><div><p className="text-sm font-semibold text-foreground">{user._count.memberships}</p><p className="text-[11px] text-muted-foreground">Memberships</p></div></div>
      <div className="flex min-w-0 items-center gap-2"><WorkspaceIcon label="permissions" className="h-4 w-4" /><div><p className="text-sm font-semibold text-foreground">{user._count.platformPermissions}</p><p className="text-[11px] text-muted-foreground">Permissions</p></div></div>
    </div>
    <p className="text-[11px] text-muted-foreground">{user.lastLoginAt ? `Last sign-in ${new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(user.lastLoginAt)}` : "Has not signed in yet"}</p>
  </Link>;
}
