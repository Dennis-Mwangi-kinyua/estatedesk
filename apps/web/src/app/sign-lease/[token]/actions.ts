"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { declineLease, signLease } from "@/lib/leases/signing";
import { requireUserSession } from "@/lib/auth/session";
import { validateImageBytes, validateImageFile } from "@/lib/uploads/secure-image";

function evidence(headerStore: Headers) {
  return { ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"), userAgent: headerStore.get("user-agent") };
}

export async function signLeaseAction(formData: FormData) {
  const session = await requireUserSession();
  const token = String(formData.get("token") ?? "");
  const signatureText = String(formData.get("signatureText") ?? "");
  const headerStore = await headers();
  const signatureMethod = String(formData.get("signatureMethod") ?? "TYPED") as "TYPED" | "DRAWN" | "UPLOADED";
  let signatureImage: Uint8Array | null = null;
  if (signatureMethod === "DRAWN") {
    const data = String(formData.get("signatureData") ?? "");
    if (data.startsWith("data:image/png;base64,")) {
      signatureImage = validateImageBytes(
        Buffer.from(data.slice(data.indexOf(",") + 1), "base64"),
        { maxBytes: 2_000_000, allowedMimeTypes: ["image/png"] },
      ).buffer;
    }
  } else if (signatureMethod === "UPLOADED") {
    const file = formData.get("signatureFile");
    if (!(file instanceof File)) throw new Error("Upload a PNG signature image.");
    signatureImage = (
      await validateImageFile(file, {
        maxBytes: 2_000_000,
        allowedMimeTypes: ["image/png"],
      })
    ).buffer;
  }
  await signLease({ token, userId: session.userId, signatureText, signatureMethod, signatureImage, consent: formData.get("consent") === "on", ...evidence(headerStore) });
  redirect(`/sign-lease/${encodeURIComponent(token)}?completed=1`);
}

export async function declineLeaseAction(formData: FormData) {
  const session = await requireUserSession();
  const token = String(formData.get("token") ?? "");
  const headerStore = await headers();
  const context = await import("@/lib/leases/signing").then((module) => module.getLeaseSigningContext(token));
  if (!context?.userId || context.userId !== session.userId) throw new Error("Sign in using the account assigned to this request.");
  await declineLease({ token, reason: String(formData.get("reason") ?? ""), ...evidence(headerStore) });
  redirect(`/sign-lease/${encodeURIComponent(token)}?declined=1`);
}
