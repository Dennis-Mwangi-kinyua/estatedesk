ALTER TABLE "DataExportRequest"
ADD COLUMN "deliveryMethod" TEXT NOT NULL DEFAULT 'DOWNLOAD',
ADD COLUMN "deliveryEmail" TEXT,
ADD COLUMN "emailSentAt" TIMESTAMP(3),
ADD COLUMN "emailDeliveryError" TEXT;
