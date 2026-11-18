CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL, "ownerId" TEXT NOT NULL, "subject" VARCHAR(160) NOT NULL,
  "category" VARCHAR(30) NOT NULL, "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportReply" (
  "id" TEXT NOT NULL, "ticketId" TEXT NOT NULL, "authorId" TEXT NOT NULL,
  "body" VARCHAR(4000) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportReply_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportTicket_ownerId_updatedAt_idx" ON "SupportTicket"("ownerId", "updatedAt");
CREATE INDEX "SupportTicket_status_updatedAt_idx" ON "SupportTicket"("status", "updatedAt");
CREATE INDEX "SupportReply_ticketId_createdAt_idx" ON "SupportReply"("ticketId", "createdAt");
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportReply" ADD CONSTRAINT "SupportReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportReply" ADD CONSTRAINT "SupportReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
