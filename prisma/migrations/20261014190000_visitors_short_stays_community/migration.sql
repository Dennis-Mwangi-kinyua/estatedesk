-- AlterTable
ALTER TABLE "BnbListing" ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "propertyId" TEXT;

-- CreateTable
CREATE TABLE "GateAssignment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GateAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorPass" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "tenantUserId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "visitorName" VARCHAR(120) NOT NULL,
    "visitorPhone" VARCHAR(25),
    "vehiclePlate" VARCHAR(25),
    "tokenHash" CHAR(64) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "admittedAt" TIMESTAMP(3),
    "admittedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BnbReservation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "guestName" VARCHAR(120) NOT NULL,
    "guestPhone" VARCHAR(25),
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "guestTokenHash" CHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BnbReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BnbGuestRequest" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BnbGuestRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityNotice" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "message" VARCHAR(6000) NOT NULL,
    "publishedByUserId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "CommunityNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityNoticeRecipient" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "recipientKey" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "reservationId" TEXT,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "CommunityNoticeRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GateAssignment_orgId_userId_propertyId_key" ON "GateAssignment"("orgId", "userId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorPass_tokenHash_key" ON "VisitorPass"("tokenHash");

-- CreateIndex
CREATE INDEX "VisitorPass_orgId_tenantUserId_createdAt_idx" ON "VisitorPass"("orgId", "tenantUserId", "createdAt");

-- CreateIndex
CREATE INDEX "VisitorPass_orgId_propertyId_validUntil_idx" ON "VisitorPass"("orgId", "propertyId", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "BnbReservation_guestTokenHash_key" ON "BnbReservation"("guestTokenHash");

-- CreateIndex
CREATE INDEX "BnbReservation_listingId_checkIn_checkOut_idx" ON "BnbReservation"("listingId", "checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "BnbGuestRequest_reservationId_createdAt_idx" ON "BnbGuestRequest"("reservationId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityNotice_orgId_propertyId_publishedAt_idx" ON "CommunityNotice"("orgId", "propertyId", "publishedAt");

-- CreateIndex
CREATE INDEX "CommunityNoticeRecipient_userId_readAt_idx" ON "CommunityNoticeRecipient"("userId", "readAt");

-- CreateIndex
CREATE INDEX "CommunityNoticeRecipient_reservationId_readAt_idx" ON "CommunityNoticeRecipient"("reservationId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityNoticeRecipient_noticeId_recipientKey_key" ON "CommunityNoticeRecipient"("noticeId", "recipientKey");

-- AddForeignKey
ALTER TABLE "GateAssignment" ADD CONSTRAINT "GateAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorPass" ADD CONSTRAINT "VisitorPass_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BnbReservation" ADD CONSTRAINT "BnbReservation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "BnbListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BnbGuestRequest" ADD CONSTRAINT "BnbGuestRequest_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "BnbReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityNotice" ADD CONSTRAINT "CommunityNotice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityNoticeRecipient" ADD CONSTRAINT "CommunityNoticeRecipient_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "CommunityNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

