import Link from "next/link";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { supportTicketWhere, isSupportAgent } from "@/features/customer-support/policy";
import { privatePageMetadata } from "@/lib/seo";
import { SupportForm } from "./forms";
export const dynamic = "force-dynamic";
export const metadata = { ...privatePageMetadata, title: "Customer support" };
export default async function CustomerSupport({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireUserSession();
  const page = Math.min(10000, Math.max(1, Math.floor(Number((await searchParams).page) || 1)));
  const where = supportTicketWhere(session.userId, session.platformRole);
  const tickets = await prisma.supportTicket.findMany({ where, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 21, select: { id: true, subject: true, category: true, status: true } });
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
    <h1 className="text-3xl font-semibold">{isSupportAgent(session.platformRole) ? "Customer support inbox" : "Customer support"}</h1>
    <p>1. Describe your problem. 2. Open your request to track replies. 3. Reply if you need more help, or mark it resolved.</p>
    <p className="text-sm text-muted-foreground">For repairs, rent decisions or tenancy issues, contact your property office. This inbox is for EstateDesk account and application support.</p>
    <section className="rounded-2xl border p-5"><h2 className="mb-4 text-xl font-semibold">New request</h2><SupportForm /></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">{isSupportAgent(session.platformRole) ? "All customer requests" : "My requests"}</h2>
      {!tickets.length ? <p>No requests yet.</p> : tickets.slice(0,20).map(ticket => <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`} className="block rounded-xl border p-4"><span className="font-semibold">{ticket.subject}</span><span className="mt-1 block text-sm text-muted-foreground">{ticket.category} · {ticket.status}</span></Link>)}
      <nav aria-label="Request pages" className="flex gap-4">{page > 1 ? <Link href={`?page=${page-1}`}>Previous</Link> : null}{tickets.length > 20 ? <Link href={`?page=${page+1}`}>Next</Link> : null}</nav>
    </section>
    <Link className="underline" href="/dashboard/help">Back to help</Link>
  </main>;
}
