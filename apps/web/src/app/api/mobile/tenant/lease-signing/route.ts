import { rolePolicyBlocksPath } from "@/lib/permissions/org-role-policy";
import { prisma } from "@/lib/prisma";
import { nativeRoute } from "@/lib/mobile/route";
import { readBoundedJson } from "@/lib/security/bounded-json";
import { nativeSignature } from "@/lib/mobile/signature";
import { mobileJson } from "@/lib/mobile/api";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { mobileLeaseSigningInputSchema } from "@estatedesk/contracts/mobile";
import { issuePendingLeaseSigningUrl } from "@/lib/tenant/get-tenant-portal-context";
import { declineLease, signLease } from "@/lib/leases/signing";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (rolePolicyBlocksPath(session.orgRolePolicy, "/api/mobile/tenant/leases") || !await nativeTenantSection(session, "/dashboard/tenant/lease")) return mobileJson({ error: "Lease access is unavailable." }, 403);
    const signers = await prisma.leaseSignatureSigner.findMany({
      where: { userId: session.userId, status: "PENDING", envelope: { orgId: session.activeOrgId!, status: { in: ["PENDING", "PARTIALLY_SIGNED"] }, expiresAt: { gt: new Date() }, lease: { deletedAt: null, tenant: { userId: session.userId, deletedAt: null } } } },
      include: { envelope: { include: { lease: { include: { unit: { include: { property: true } } } }, signers: { select: { signingOrder: true, status: true } } } } }, take: 100,
    });
    return mobileJson(signers.map(signer => ({ id: signer.id, leaseId: signer.envelope.leaseId, name: signer.name,
      unitLabel: `${signer.envelope.lease.unit.property.name} · Unit ${signer.envelope.lease.unit.houseNo}`,
      consentText: signer.envelope.consentText, sourceDocumentHash: signer.envelope.sourceDocumentHash, expiresAt: signer.envelope.expiresAt,
      canSign: signer.envelope.signingOrder !== "SEQUENTIAL" || !signer.envelope.signers.some(other => other.signingOrder < signer.signingOrder && other.status !== "SIGNED"),
    })));
  }, { role: "TENANT" });
}

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (rolePolicyBlocksPath(session.orgRolePolicy, "/api/mobile/tenant/leases") || !await nativeTenantSection(session, "/dashboard/tenant/lease")) return mobileJson({ error: "Lease access is unavailable." }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return mobileJson({ error: "JSON required." }, 400);
    const input = mobileLeaseSigningInputSchema.parse(await readBoundedJson(request, 384000));
    const signer = await prisma.leaseSignatureSigner.findFirst({ where: { id: input.signerId, userId: session.userId, status: "PENDING", envelope: { orgId: session.activeOrgId!, sourceDocumentHash: input.sourceDocumentHash, lease: { deletedAt: null, tenant: { userId: session.userId, deletedAt: null } } } }, select: { id: true, envelopeId: true } });
    if (!signer) return mobileJson({ error: "This signing request has changed or is unavailable. Refresh your leases." }, 409);
    const signingUrl = await issuePendingLeaseSigningUrl(signer.id, session.userId);
    if (!signingUrl) return mobileJson({ error: "This signing request has expired or is no longer active." }, 409);
    const token = signingUrl.slice("/sign-lease/".length);
    const evidence = { ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"), userAgent: request.headers.get("user-agent") };
    try {
      if (input.action === "sign") {
        const signature = await nativeSignature(input);
        await signLease({ token, userId: session.userId, signatureText: input.signatureText, signatureMethod: signature.method, signatureImage: signature.bytes, consent: input.consent, ...evidence });
      }
      else await declineLease({ token, reason: input.reason, ...evidence });
    } catch (error) {
      // Signing validation messages are safe to show to the assigned signer.
      if (error instanceof Error && /consent|signature|signer|signing request|reason|legal name|earlier signer/i.test(error.message)) return mobileJson({ error: error.message }, 400);
      throw error;
    }
    return mobileJson({ ok: true });
  }, { role: "TENANT" });
}
