import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { supportTicketWhere } from "@/features/customer-support/policy";
import { privatePageMetadata } from "@/lib/seo";
import { SupportForm } from "../forms";
import { resolveTicket } from "../actions";
export const dynamic = "force-dynamic";
export const metadata = { ...privatePageMetadata, title: "Support request" };
export default async function SupportThread({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUserSession();
  const ticket = await prisma.supportTicket.findFirst({ where: { id: (await params).id, ...supportTicketWhere(session.userId, session.platformRole) }, include: { replies: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100, include: { author: { select: { fullName: true } } } } } });
  if (!ticket) notFound();
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
    <Link href="/dashboard/support" className="underline">Back to support requests</Link>
    <h1 className="text-2xl font-semibold">{ticket.subject}</h1><p>{ticket.category} · {ticket.status}</p>
    <p className="text-sm text-muted-foreground">Refresh this page to check for new replies. Showing the latest 100 messages.</p>
    <section aria-label="Conversation" className="space-y-4">{ticket.replies.slice().reverse().map(reply => <article key={reply.id} className="rounded-xl border p-4"><p className="font-semibold">{reply.author.fullName} {reply.authorId === ticket.ownerId ? "· Customer" : "· Support"}</p><time className="text-xs text-muted-foreground">{reply.createdAt.toISOString()}</time><p className="mt-2 whitespace-pre-wrap break-words">{reply.body}</p></article>)}</section>
    <section className="rounded-xl border p-4"><h2 className="mb-3 text-lg font-semibold">{ticket.status === "RESOLVED" ? "Need more help? Reply to reopen" : "Reply"}</h2><SupportForm ticketId={ticket.id} /></section>
    {ticket.status !== "RESOLVED" ? <form action={resolveTicket}><input type="hidden" name="ticketId" value={ticket.id} /><button className="min-h-11 rounded-xl border px-4">Mark resolved</button></form> : null}
  </main>;
}
