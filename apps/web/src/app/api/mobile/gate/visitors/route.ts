import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { mobileVisitorInputSchema } from "@estatedesk/contracts/mobile";
import { verifyVisitorPass, admitVisitorPass } from "@/features/visitors/actions";
export async function POST(request: Request) {
  return nativeRoute(request, async () => {
    const input = await nativeBody(request, mobileVisitorInputSchema);
    if (input.action !== "verify" && input.action !== "admit") return mobileJson({ error: "Invalid gate action." }, 400);
    const form = new FormData();
    for (const [key, value] of Object.entries(input)) form.set(key, value);
    const result = input.action === "verify" ? await verifyVisitorPass({}, form) : await admitVisitorPass({}, form);
    return mobileJson(result, result.error ? 400 : 200);
  });
}
