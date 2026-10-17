import { changeInitialPasswordAction } from "@/app/(app)/change-password/actions";
import { mobileSetupSchema } from "@estatedesk/contracts/mobile";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!session.mustChangePassword && !session.requiresTermsAcceptance) return mobileJson({ ok: true });
    const input = await nativeBody(request, mobileSetupSchema);
    const form = new FormData();
    form.set("acceptedTerms", "on");
    for (const key of ["currentPassword", "newPassword", "confirmPassword"] as const) form.set(key, input[key]);
    try {
      const result = await changeInitialPasswordAction({ error: null }, form);
      return mobileJson({ error: result.error ?? "Account setup could not be completed." }, 400);
    } catch (error) {
      if (!isRedirectError(error)) throw error;
      const destination = getURLFromRedirectError(error) ?? "";
      if (!destination.startsWith("/dashboard/") && destination !== "/platform" && destination !== "/provider") throw error;
      return mobileJson({ ok: true });
    }
  }, { setup: true });
}
