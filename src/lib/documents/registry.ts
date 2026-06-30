import "server-only";

import {
  DocumentStatus,
  DocumentType,
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import {
  createDocumentIdentity,
  type DocumentIdentityType,
} from "@/lib/documents/identity";

type DocumentDb = PrismaClient | Prisma.TransactionClient;

type IssueDocumentInput = {
  db: DocumentDb;
  orgId: string;
  documentType: DocumentType;
  entityType: string;
  entityId: string;
  title: string;
  issuedByUserId?: string | null;
  issuedAt?: Date;
  version?: number;
  status?: DocumentStatus;
  mimeType?: string;
  metadata?: Prisma.InputJsonObject;
  preferredSerialNumber?: string;
};

export async function issueDocumentRecord(input: IssueDocumentInput) {
  const version = input.version ?? 1;
  const existing = await input.db.documentRecord.findUnique({
    where: {
      orgId_documentType_entityType_entityId_version: {
        orgId: input.orgId,
        documentType: input.documentType,
        entityType: input.entityType,
        entityId: input.entityId,
        version,
      },
    },
  });

  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const identity = createDocumentIdentity(
      input.documentType as DocumentIdentityType,
      input.issuedAt,
    );
    const serialNumber =
      attempt === 0 && input.preferredSerialNumber
        ? input.preferredSerialNumber
        : identity.serialNumber;

    try {
      const document = await input.db.documentRecord.create({
        data: {
          orgId: input.orgId,
          serialNumber,
          verificationCode: identity.verificationCode,
          documentType: input.documentType,
          entityType: input.entityType,
          entityId: input.entityId,
          version,
          status: input.status ?? "ISSUED",
          title: input.title,
          mimeType: input.mimeType ?? "application/pdf",
          issuedByUserId: input.issuedByUserId ?? null,
          issuedAt: input.issuedAt,
          metadata: input.metadata,
        },
      });

      await input.db.documentEvent.create({
        data: {
          orgId: input.orgId,
          documentId: document.id,
          eventType: "ISSUED",
          actorUserId: input.issuedByUserId ?? null,
          metadata: { serialNumber: document.serialNumber, version },
        },
      });

      return document;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const concurrentlyCreated = await input.db.documentRecord.findUnique({
          where: {
            orgId_documentType_entityType_entityId_version: {
              orgId: input.orgId,
              documentType: input.documentType,
              entityType: input.entityType,
              entityId: input.entityId,
              version,
            },
          },
        });

        if (concurrentlyCreated) return concurrentlyCreated;
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to allocate a unique document identity.");
}
