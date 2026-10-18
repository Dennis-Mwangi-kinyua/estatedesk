import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";

/** Hash the actual evidence, not client-supplied hashes. Acknowledgements commit with domain writes. */
export async function fieldSubmission(form: FormData, session: AppSession, kind: "native-meter" | "native-inspection") {
  const clientId = form.get("clientId");
  if (clientId === null) return null;
  if (typeof clientId !== "string" || !/^[a-zA-Z0-9-]{16,120}$/.test(clientId)) throw new SyntaxError("Invalid draft ID.");
  const hash = createHash("sha256");
  for (const [key, value] of [...form.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (key === "clientId") continue;
    hash.update(JSON.stringify([key, typeof value === "string" ? value : { size: value.size, type: value.type }]));
    if (value instanceof File) hash.update(Buffer.from(await value.arrayBuffer()));
  }
  const identity = { orgId: session.activeOrgId!, userId: session.userId, clientId };
  const payloadHash = hash.digest("hex");
  const existing = await prisma.offlineSubmission.findUnique({ where: { orgId_userId_clientId: identity } });
  if (existing && (existing.kind !== kind || existing.payloadHash !== payloadHash)) throw new SyntaxError("This draft ID was already used for different content.");
  return { replay: !!existing, async acknowledge(tx: Prisma.TransactionClient) {
    await tx.offlineSubmission.create({ data: { ...identity, kind, payloadHash, result: { ok: true } } });
  } };
}
