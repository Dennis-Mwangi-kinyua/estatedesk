import { stickerFor } from "../../lib/presentation/stickers";
import { workspaceIconMasks } from "./workspace-icon-masks";

export function workspaceHeadingIcon(label: string) {
  const { icon: name, tone } = stickerFor(label);
  return { name, tone, mask: workspaceIconMasks[name] };
}
