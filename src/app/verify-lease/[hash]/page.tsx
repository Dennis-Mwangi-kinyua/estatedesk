import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, FileCheck2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { publicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}): Promise<Metadata> {
  const { hash } = await params;

  return publicPageMetadata({
    title: "Verify Signed Lease",
    description:
      "Confirm that a signed lease fingerprint matches the final document registered by EstateDesk.",
    path: `/verify-lease/${hash}`,
  });
}
export default async function VerifySignedLeasePage({params}:{params:Promise<{hash:string}>}){
  const {hash}=await params; if(!/^[a-f0-9]{64}$/i.test(hash))notFound();
  const envelope=await prisma.leaseSignatureEnvelope.findUnique({where:{finalDocumentHash:hash.toLowerCase()},include:{org:{select:{name:true}},lease:{include:{unit:{include:{property:true}}}},signers:{select:{role:true,name:true,signedAt:true,signatureMethod:true}},events:{where:{eventType:"COMPLETED"},take:1}}});
  if(!envelope||envelope.status!=="COMPLETED")notFound();
  return <main className="min-h-screen bg-neutral-100 p-4 sm:p-10"><div className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 sm:p-8"><BadgeCheck className="h-10 w-10 text-emerald-700"/><p className="mt-5 text-sm font-semibold text-emerald-700">EstateDesk signed-document registry</p><h1 className="text-3xl font-bold">Signed lease verified</h1><div className="mt-6 grid gap-3 sm:grid-cols-2">{[["Issued by",envelope.org.name],["Property",envelope.lease.unit.property.name],["Unit",envelope.lease.unit.houseNo],["Version",String(envelope.version)],["Jurisdiction",envelope.jurisdiction],["Completed",envelope.completedAt?.toLocaleString("en-KE")??"—"]].map(([label,value])=><div key={label} className="rounded-lg bg-neutral-50 p-3"><p className="text-xs text-neutral-500">{label}</p><p className="font-semibold">{value}</p></div>)}</div><h2 className="mt-6 flex items-center gap-2 font-bold"><FileCheck2 className="h-5 w-5"/>Signers</h2><div className="mt-3 space-y-2">{envelope.signers.map((signer,index)=><div key={index} className="rounded-lg border p-3 text-sm"><b>{signer.role}: {signer.name}</b><br/><span className="text-neutral-500">{signer.signatureMethod} · {signer.signedAt?.toLocaleString("en-KE")}</span></div>)}</div><p className="mt-6 break-all rounded-lg bg-neutral-950 p-4 font-mono text-xs text-white">SHA-256 {envelope.finalDocumentHash}</p><p className="mt-4 text-xs text-neutral-500">This page confirms that the supplied fingerprint matches the final signed PDF registered by EstateDesk. It does not represent a government-issued qualified signature certificate.</p></div></main>;
}
