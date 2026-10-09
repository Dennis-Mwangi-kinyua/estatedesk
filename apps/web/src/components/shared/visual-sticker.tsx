import { WorkspaceIcon } from "./workspace-icon";
import { stickerFor } from "@/lib/presentation/stickers";
/** A decorative accent. The adjacent heading or label provides its meaning. */
export function VisualSticker({ label, size = "sm", className = "" }: { label: string; size?: "xs" | "sm" | "lg"; className?: string }) {
  const sticker = stickerFor(label);
  return <span aria-hidden="true" className={`visual-sticker visual-sticker--${size} ${className}`} data-sticker-tone={sticker.tone}><WorkspaceIcon label={label} className={size === "lg" ? "h-8 w-8" : size === "xs" ? "h-4 w-4" : "h-5 w-5"} /></span>;
}
