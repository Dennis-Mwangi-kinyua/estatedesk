import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";
import { termsTitle, termsDescription, termsUpdatedAt, termsSections } from "@/lib/terms";
import { privacyTitle, privacyDescription, privacyUpdatedAt, privacySections } from "@/lib/legal/privacy";

export async function GET(request: Request) {
  return nativeRoute(request, async () => {
    const kind = new URL(request.url).searchParams.get("kind");
    if (kind !== "terms" && kind !== "privacy") return mobileJson({ error: "Choose terms or privacy." }, 400);
    return mobileJson(kind === "terms" ? { title: termsTitle, description: termsDescription, updatedAt: termsUpdatedAt, sections: termsSections }
      : { title: privacyTitle, description: privacyDescription, updatedAt: privacyUpdatedAt, sections: privacySections });
  }, { setup: true });
}
