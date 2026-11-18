import { ticketSchema, replySchema, supportTicketWhere } from "../domain/policy";
import type { SupportActor, SupportDependencies } from "./ports";

export class SupportError extends Error {}
export function createSupportService({ repository, allowMutation }: SupportDependencies) {
  const scope = (actor: SupportActor) => {
    if (!actor.userId || actor.mustChangePassword || actor.requiresTermsAcceptance) throw new SupportError("Complete your account setup first.");
    return supportTicketWhere(actor.userId, actor.platformRole);
  };
  const permit = async (actor: SupportActor) => {
    const access = scope(actor);
    if (!await allowMutation(actor.userId)) throw new SupportError("Too many requests. Please try again later.");
    return access;
  };
  return {
    async create(actor: SupportActor, input: unknown) {
      scope(actor);
      const parsed = ticketSchema.safeParse(input);
      if (!parsed.success) throw new SupportError("Enter a subject (3–160 characters), category, and description (10–4,000 characters).");
      await permit(actor);
      return repository.create(actor.userId, parsed.data.subject, parsed.data.category, parsed.data.body);
    },
    async list(actor: SupportActor, page = 1) {
      const safePage = Number.isFinite(page) ? Math.min(10000, Math.max(1, Math.floor(page))) : 1;
      return repository.list(scope(actor), safePage);
    },
    async find(actor: SupportActor, id: string) {
      return repository.find(scope(actor), id.slice(0, 100));
    },
    async reply(actor: SupportActor, input: unknown) {
      const access = scope(actor);
      const parsed = replySchema.safeParse(input);
      if (!parsed.success) throw new SupportError("Enter a reply of 1–4,000 characters.");
      await permit(actor);
      if (!await repository.reply(access, parsed.data.ticketId, actor.userId, parsed.data.body)) throw new SupportError("The request is unavailable.");
    },
    async resolve(actor: SupportActor, id: string) {
      const access = await permit(actor);
      if (!await repository.resolve(access, id.slice(0, 100))) throw new SupportError("The request is unavailable.");
    },
  };
}
