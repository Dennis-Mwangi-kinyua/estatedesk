import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

export function submissionIdentity(actorUserId: string, scope: string, token: string, payload: unknown) {
  if (!/^[a-f0-9-]{36}$/i.test(token)) throw new Error("Reopen this form before submitting.");
  const hash = (value: string) => createHash("sha256").update(value).digest("hex");
  return { id: hash(JSON.stringify([actorUserId, scope, token])), actorUserId, scope, fingerprint: hash(JSON.stringify(payload)) };
}

export function formSubmissionToken(form: FormData) {
  const value = form.get("_submissionId");
  // Older clients remain supported; new forms retain their token across retries.
  return typeof value === "string" && value ? value : randomUUID();
}

type Identity = ReturnType<typeof submissionIdentity>;
function matching(receipt: { fingerprint: string }, identity: Identity) {
  if (receipt.fingerprint !== identity.fingerprint) throw new Error("This submission has changed. Refresh the workspace before starting another operation.");
}

/** The receipt and business writes commit or roll back together. */
export async function transactionalSubmission(db: PrismaClient, identity: Identity, work: (tx: Prisma.TransactionClient) => Promise<string>) {
  try {
    return await db.$transaction(async tx => {
      const previous = await tx.workflowSubmission.findUnique({ where: { id: identity.id } });
      if (previous) { matching(previous, identity); if (previous.status !== "SUCCEEDED") throw new Error("Check the workspace for the earlier submission before continuing."); return previous.resourceId!; }
      await tx.workflowSubmission.create({ data: { ...identity, status: "PROCESSING" } });
      const resourceId = await work(tx);
      await tx.workflowSubmission.update({ where: { id: identity.id }, data: { status: "SUCCEEDED", resourceId } });
      return resourceId;
    }, { maxWait: 10000, timeout: 30000 });
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2002") throw error;
    const previous = await db.workflowSubmission.findUnique({ where: { id: identity.id } });
    if (!previous) throw error;
    matching(previous, identity);
    if (previous.status !== "SUCCEEDED") throw new Error("The earlier submission is still being checked. Refresh the workspace.");
    return previous.resourceId!;
  }
}

/** Server actions may commit independently, so uncertain outcomes never run twice. */
export async function guardedSubmission(db: PrismaClient, identity: Identity, work: () => Promise<Response>) {
  try { await db.workflowSubmission.create({ data: { ...identity, status: "PROCESSING" } }); }
  catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2002") throw error;
    const previous = await db.workflowSubmission.findUnique({ where: { id: identity.id } });
    if (!previous) throw error;
    matching(previous, identity);
    return Response.json(previous.status === "SUCCEEDED"
      ? { ok: true, message: "This operation already completed. Refresh the workspace to see the result." }
      : { error: "The earlier operation is pending or its outcome is unknown. Check the workspace before submitting again." }, { status: previous.status === "SUCCEEDED" ? 200 : 409, headers: { "Cache-Control": "no-store", Vary: "Cookie" } });
  }
  try {
    const response = await work();
    await db.workflowSubmission.update({ where: { id: identity.id }, data: { status: response.ok ? "SUCCEEDED" : "UNCERTAIN" } });
    return response;
  } catch (error) {
    await db.workflowSubmission.updateMany({ where: { id: identity.id, status: "PROCESSING" }, data: { status: "UNCERTAIN" } });
    throw error;
  }
}
