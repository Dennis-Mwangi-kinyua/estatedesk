import { stickerFor } from "../../lib/presentation/stickers";
import { workspaceIconArtwork } from "./workspace-icon-artwork";
import { workspaceIconMasks } from "./workspace-icon-masks";

export function workspaceHeadingIcon(label: string) {
  const { icon: name, tone } = stickerFor(label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${workspaceIconArtwork[name]}</svg>`;
  return { name, tone, mask: workspaceIconMasks[name], image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` };
}
