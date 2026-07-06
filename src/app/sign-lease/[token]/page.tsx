import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { BadgeCheck, FileSignature } from "lucide-react";
import { auditSensitivePageView } from "@/lib/audit/sensitive-pages";
import { getLeaseSigningContext, recordLeaseSignatureView } from "@/lib/leases/signing";
import { storage } from "@/lib/storage";
import { declineLeaseAction, signLeaseAction } from "./actions";
import { SignatureInput } from "./signature-input";
import { getUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review and sign lease", robots: { index: false, follow: false } };

export default async function SignLeasePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const signer = await getLeaseSigningContext(token);
  if (!signer) notFound();
  const session = await getUserSession();
  if (!session) return <main className="grid min-h-screen place-items-center bg-neutral-100 p-4"><section className="max-w-md rounded-2xl border bg-white p-7"><h1 className="text-2xl font-bold">Login verification required</h1><p className="mt-3 text-sm text-neutral-600">Sign in to the EstateDesk account assigned to this request. You will return here automatically.</p><Link href={`/login?returnTo=${encodeURIComponent(`/sign-lease/${token}`)}`} className="mt-5 inline-flex rounded-lg bg-neutral-950 px-4 py-2 text-sm font-bold text-white">Sign in</Link></section></main>;
  if (!signer.userId || signer.userId !== session.userId) return <main className="grid min-h-screen place-items-center bg-neutral-100 p-4"><section className="max-w-md rounded-2xl border bg-white p-7"><h1 className="text-2xl font-bold">Wrong account</h1><p className="mt-3 text-sm text-neutral-600">This signing request belongs to another authenticated user.</p></section></main>;
  await auditSensitivePageView(session, `/sign-lease/${token}`);
  const headerStore = await headers();
  await recordLeaseSignatureView(signer.id, signer.envelopeId, headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"), headerStore.get("user-agent"));
  const { envelope } = signer;
  const expired = envelope.expiresAt <= new Date();
  const sourceKey = envelope.lease.contractDocument?.key;
  const documentUrl = sourceKey ? (/^https?:\/\//.test(sourceKey) ? sourceKey : storage.getPublicUrl(sourceKey)) : null;
  const inactive = expired || !["PENDING", "PARTIALLY_SIGNED"].includes(envelope.status) || signer.status !== "PENDING";
  return <main className="min-h-screen bg-neutral-100 p-4 sm:p-8"><div className="mx-auto max-w-4xl space-y-5"><header className="rounded-2xl bg-neutral-950 p-6 text-white"><FileSignature className="h-8 w-8 text-emerald-400"/><p className="mt-4 text-sm text-neutral-400">{envelope.org.name}</p><h1 className="text-2xl font-bold">Review and sign lease</h1><p className="mt-2 text-sm text-neutral-300">{envelope.lease.unit.property.name} · Unit {envelope.lease.unit.houseNo} · Signer: {signer.name}</p></header>
  {envelope.status === "COMPLETED" || signer.status === "SIGNED" ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><BadgeCheck className="h-8 w-8 text-emerald-700"/><h2 className="mt-3 text-xl font-bold">Signature recorded</h2><p className="mt-2 text-sm text-emerald-900">The evidence trail is secured. The final signed PDF becomes available when both parties have signed.</p></section> : null}
  <section className="rounded-2xl border bg-white p-4"><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold">Lease contract</h2><p className="text-xs text-neutral-500">SHA-256: {envelope.sourceDocumentHash}</p></div>{documentUrl?<a href={documentUrl} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-sm font-semibold">Open PDF</a>:null}</div>{documentUrl?<iframe title="Lease contract" src={documentUrl} className="mt-4 h-[60vh] w-full rounded-lg border"/>:null}</section>
  {!inactive ? <section className="grid gap-5 md:grid-cols-2"><form action={signLeaseAction} className="rounded-2xl border bg-white p-5"><input type="hidden" name="token" value={token}/><h2 className="font-bold">Electronic signature</h2><p className="mt-2 text-sm text-neutral-600">Your authenticated account, signature, time, IP address, device and document hash form the evidence record.</p><SignatureInput defaultName={signer.name}/><label className="mt-4 flex gap-2 text-sm"><input type="checkbox" name="consent" required/><span>{envelope.consentText}</span></label><button className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Sign lease</button></form><form action={declineLeaseAction} className="rounded-2xl border bg-white p-5"><input type="hidden" name="token" value={token}/><h2 className="font-bold">Decline</h2><label className="mt-4 block text-sm">Reason<textarea name="reason" required minLength={5} className="mt-1 min-h-28 w-full rounded-lg border px-3 py-2"/></label><button className="mt-5 rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-700">Decline to sign</button></form></section> : null}
  <footer className="text-center text-xs text-neutral-500">Electronic signing evidence provided by EstateDesk. This is not a government-issued digital certificate.</footer></div></main>;
}
