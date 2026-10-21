import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verify tenancy agreement", robots: { index: false, follow: false } };
export default async function VerifyLeaseEnvelope({ params }: { params: Promise<{ envelopeId: string }> }) {
  const { envelopeId } = await params;
  const envelope = await prisma.leaseSignatureEnvelope.findUnique({ where: { id: envelopeId }, select: { status: true, finalDocumentHash: true } });
  if (!envelope || envelope.status !== "COMPLETED" || !envelope.finalDocumentHash) notFound();
  redirect(`/verify-lease/${envelope.finalDocumentHash}`);
}
