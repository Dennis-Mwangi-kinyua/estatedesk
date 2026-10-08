import { VisualSticker } from "./visual-sticker";

/** The adjacent navigation label supplies the accessible name. */
export function SidebarSticker({ href }: { href: string }) {
  const [path, hash] = href.split("#");
  const segments = path.split("?")[0].split("/").filter(Boolean);
  const key = hash || segments[segments.length - 1] || "dashboard";
  return <VisualSticker label={key} size="xs" className="sidebar-sticker" />;
}
