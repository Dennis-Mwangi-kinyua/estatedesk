import { z } from "zod";

/** Domain event envelope for the eventual outbox bus. */
export const domainEventEnvelopeSchema = z.object({
  id: z.string(),
  type: z.string(),
  occurredAt: z.string(),
  orgId: z.string().nullable().optional(),
  producer: z.string(),
  payload: z.record(z.string(), z.unknown()),
  correlationId: z.string().optional(),
});

export const domainEventTypeSchema = z.enum([
  "payment.recorded",
  "payment.allocated",
  "lease.activated",
  "lease.ended",
  "issue.created",
  "issue.resolved",
  "membership.changed",
  "document.stored",
]);

export type DomainEventEnvelope = z.infer<typeof domainEventEnvelopeSchema>;
export type DomainEventType = z.infer<typeof domainEventTypeSchema>;
