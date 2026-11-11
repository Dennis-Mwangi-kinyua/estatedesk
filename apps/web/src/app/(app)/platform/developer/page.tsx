import { redirect } from "next/navigation";

/** Preserve old bookmarks while keeping one platform home. */
export default function LegacyDeveloperHome() {
  redirect("/platform");
}
