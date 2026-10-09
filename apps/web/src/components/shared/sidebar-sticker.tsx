import { VisualSticker } from "./visual-sticker";

/** Keep the complete destination so nested sections retain their meaning. */
export function SidebarSticker({ href }: { href: string }) {
  return <VisualSticker label={href} size="xs" className="sidebar-sticker" />;
}
