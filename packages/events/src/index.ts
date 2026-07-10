import type { DomainEventEnvelope } from "@estatedesk/contracts";

/**
 * Outbox / event bus interfaces for Phase 2+.
 * Phase 1 defines the contract only — no broker wiring.
 */

export type OutboxRecord = DomainEventEnvelope & {
  publishedAt: string | null;
  attempts: number;
};

export type EventPublisher = {
  publish: (event: DomainEventEnvelope) => Promise<void>;
};

export type EventConsumer = {
  handle: (event: DomainEventEnvelope) => Promise<void>;
};

export function createEventEnvelope(
  input: Omit<DomainEventEnvelope, "id" | "occurredAt"> & {
    id?: string;
    occurredAt?: string;
  },
): DomainEventEnvelope {
  return {
    id: input.id ?? crypto.randomUUID(),
    type: input.type,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    orgId: input.orgId ?? null,
    producer: input.producer,
    payload: input.payload,
    correlationId: input.correlationId,
  };
}

/** In-process publisher used until a real outbox exists. */
export function createInProcessPublisher(
  handlers: EventConsumer[] = [],
): EventPublisher {
  return {
    async publish(event) {
      for (const handler of handlers) {
        await handler.handle(event);
      }
    },
  };
}
