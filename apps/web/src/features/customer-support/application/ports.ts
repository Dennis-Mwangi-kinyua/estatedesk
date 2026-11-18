export type SupportActor = { userId: string; platformRole: string; mustChangePassword?: boolean; requiresTermsAcceptance?: boolean };
export type TicketScope = { ownerId?: string };
export type TicketSummary = { id: string; subject: string; category: string; status: string };
export type TicketThread = TicketSummary & { ownerId: string; replies: { id: string; authorId: string; body: string; createdAt: Date; author: { fullName: string } }[] };
export interface SupportRepository {
  create(ownerId: string, subject: string, category: string, body: string): Promise<string>;
  list(scope: TicketScope, page: number): Promise<TicketSummary[]>;
  find(scope: TicketScope, id: string): Promise<TicketThread | null>;
  reply(scope: TicketScope, id: string, authorId: string, body: string): Promise<boolean>;
  resolve(scope: TicketScope, id: string): Promise<boolean>;
}
export type SupportDependencies = { repository: SupportRepository; allowMutation: (userId: string) => Promise<boolean> };
