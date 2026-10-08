"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { writeAuditLog } from "@/lib/audit/security";
import { saveImagePayloadAsset } from "@/lib/uploads/image-payload";
import { validateImageFile } from "@/lib/uploads/secure-image";
import { logServerError } from "@/lib/errors/server-error-log";
import { MAX_BNB_PHOTOS, MAX_BNB_PHOTO_BYTES, MAX_BNB_UPLOAD_BYTES, parseBnbForm, type BnbFormState } from "./validation";

async function requireBnbEditor() {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  await requireActiveSubscription(session.activeOrgId!);
  return session;
}
function refresh(slug: string) {
  revalidatePath("/dashboard/org/airbnb");
  revalidatePath("/stays");
  revalidatePath(`/stays/${slug}`);
}

export async function saveBnbAction(_state: BnbFormState, formData: FormData): Promise<BnbFormState> {
  const session = await requireBnbEditor();
  const orgId = session.activeOrgId!;
  const parsed = parseBnbForm(formData);
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const id = String(formData.get("id") ?? "");
  const existing = id ? await prisma.bnbListing.findFirst({
    where: { id, orgId, deletedAt: null },
    include: { images: { where: { deletedAt: null }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  }) : null;
  if (id && !existing) return { error: "Listing not found in your organization." };
  const retained = Array.from(new Set(formData.getAll("retainedImages").map(String)));
  if (retained.some((imageId) => !existing?.images.some((image) => image.id === imageId))) return { error: "One or more photos do not belong to this listing." };
  const files = formData.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);
  const photoCount = retained.length + files.length;
  if (photoCount > MAX_BNB_PHOTOS) return { error: `Choose at most ${MAX_BNB_PHOTOS} photos.` };
  if (parsed.data.status === "PUBLISHED" && photoCount === 0) return { error: "Add at least one photo before publishing." };
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_BNB_UPLOAD_BYTES) return { error: "New photos must total less than 6 MB. Choose smaller images." };
  const validated = [];
  try {
    // Validate the entire batch before uploading any files.
    for (const file of files) validated.push({ file, image: await validateImageFile(file, { maxBytes: MAX_BNB_PHOTO_BYTES }) });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid photos." };
  }
  const uploadedIds: string[] = [];
  let saved: { id: string; slug: string };
  try {
    for (const { file, image } of validated) {
      uploadedIds.push(await saveImagePayloadAsset({
        payload: { base64: image.buffer.toString("base64"), fileName: file.name.slice(0, 200), mimeType: image.mimeType, size: image.size },
        uploadDir: "bnb", filePrefix: "stay", orgId, submittedByUserId: session.userId, purpose: "BNB_LISTING",
      }));
    }
    saved = await prisma.$transaction(async (tx) => {
      const data = { ...parsed.data, images: { connect: uploadedIds.map((imageId) => ({ id: imageId })) } };
      const listing = existing
        ? await tx.bnbListing.update({ where: { id: existing.id, orgId, deletedAt: null }, data })
        : await tx.bnbListing.create({ data: { ...data, orgId, slug: `${parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 75) || "stay"}-${randomUUID().slice(0, 8)}` } });
      if (existing) await tx.asset.updateMany({
        where: { bnbListingId: listing.id, orgId, deletedAt: null, id: { notIn: [...retained, ...uploadedIds] } },
        data: { deletedAt: new Date() },
      });
      if (listing.status === "PUBLISHED" && await tx.asset.count({ where: { bnbListingId: listing.id, orgId, deletedAt: null } }) === 0) {
        throw new Error("Add at least one photo before publishing.");
      }
      return { id: listing.id, slug: listing.slug };
    });
  } catch (error) {
    if (uploadedIds.length) await prisma.asset.updateMany({ where: { id: { in: uploadedIds }, orgId, bnbListingId: null }, data: { deletedAt: new Date() } }).catch(() => undefined);
    logServerError("saveBnbAction", error);
    return { error: "Could not save the listing. Check your photo storage configuration and try again." };
  }
  await writeAuditLog({ orgId, actorUserId: session.userId, action: existing ? "BNB_UPDATED" : "BNB_CREATED", entityType: "BnbListing", entityId: saved.id, metadata: { status: parsed.data.status } });
  refresh(saved.slug);
  redirect("/dashboard/org/airbnb?saved=1");
}

export async function changeBnbStatusAction(_state: BnbFormState, formData: FormData): Promise<BnbFormState> {
  const session = await requireBnbEditor();
  const orgId = session.activeOrgId!;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["PUBLISHED", "PAUSED", "ARCHIVED"].includes(status)) return { error: "Invalid listing status." };
  let listing;
  try {
    listing = await prisma.$transaction(async (tx) => {
      const saved = await tx.bnbListing.update({
        where: { id, orgId, deletedAt: null },
        data: status === "ARCHIVED" ? { status: "PAUSED", deletedAt: new Date() } : { status: status as "PUBLISHED" | "PAUSED" },
      });
      if (status === "PUBLISHED" && await tx.asset.count({ where: { bnbListingId: id, orgId, deletedAt: null } }) === 0) throw new Error("Add a photo before publishing.");
      return saved;
    });
  } catch {
    return { error: "Could not update this listing. Check that it belongs to your organization and has a photo before publishing." };
  }
  await writeAuditLog({ orgId, actorUserId: session.userId, action: `BNB_${status}`, entityType: "BnbListing", entityId: id });
  refresh(listing.slug);
  return {};
}
