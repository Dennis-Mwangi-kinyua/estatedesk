"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { ticketSchema, replySchema, supportTicketWhere } from "@/features/customer-support/policy";

export type SupportState = { error?: string };
async function actor() {
  const session = await requireUserSession();
  if (session.mustChangePassword || session.requiresTermsAcceptance) redirect("/change-password");
  return session;
}
async function limited(userId: string) {
  return (await checkRateLimit({ key: `customer-support:${userId}`, limit: 20, windowMs: 3600000 })).allowed;
}
export async function createTicket(_previous: SupportState, form: FormData): Promise<SupportState> {
  const session = await actor();
  const input = ticketSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return { error: "Enter a subject (3–160 characters), category, and description (10–4,000 characters)." };
  if (!await limited(session.userId)) return { error: "Too many requests. Please try again later." };
  let id: string;
  try {
    const ticket = await prisma.supportTicket.create({ data: { ownerId: session.userId, subject: input.data.subject, category: input.data.category, replies: { create: { authorId: session.userId, body: input.data.body } } } });
    id = ticket.id;
  } catch { return { error: "Your request could not be saved. Please try again." }; }
  redirect(`/dashboard/support/${id}`);
}
export async function replyTicket(_previous: SupportState, form: FormData): Promise<SupportState> {
  const session = await actor();
  const input = replySchema.safeParse(Object.fromEntries(form));
  if (!input.success) return { error: "Enter a reply of 1–4,000 characters." };
  if (!await limited(session.userId)) return { error: "Too many replies. Please try again later." };
  try {
    await prisma.$transaction(async tx => {
      const ticket = await tx.supportTicket.updateMany({ where: { id: input.data.ticketId, ...supportTicketWhere(session.userId, session.platformRole) }, data: { status: "OPEN", updatedAt: new Date() } });
      if (ticket.count !== 1) throw new Error("Unavailable");
      await tx.supportReply.create({ data: { ticketId: input.data.ticketId, authorId: session.userId, body: input.data.body } });
    });
  } catch { return { error: "The request is unavailable or your reply could not be saved." }; }
  revalidatePath(`/dashboard/support/${input.data.ticketId}`);
  return {};
}
export async function resolveTicket(form: FormData) {
  const session = await actor();
  const id = String(form.get("ticketId") ?? "").slice(0,100);
  await prisma.supportTicket.updateMany({ where: { id, ...supportTicketWhere(session.userId, session.platformRole) }, data: { status: "RESOLVED" } });
  revalidatePath(`/dashboard/support/${id}`);
}
