CREATE TABLE "NativePushDevice" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NativePushDevice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NativePushDevice_token_key" ON "NativePushDevice"("token");
CREATE INDEX "NativePushDevice_sessionId_idx" ON "NativePushDevice"("sessionId");
ALTER TABLE "NativePushDevice" ADD CONSTRAINT "NativePushDevice_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NativePushDelivery" (
  "id" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CLAIMED',
  "ticketId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NativePushDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NativePushDelivery_deviceId_notificationId_key" ON "NativePushDelivery"("deviceId", "notificationId");
CREATE INDEX "NativePushDelivery_status_createdAt_idx" ON "NativePushDelivery"("status", "createdAt");
ALTER TABLE "NativePushDelivery" ADD CONSTRAINT "NativePushDelivery_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "NativePushDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NativePushDelivery" ADD CONSTRAINT "NativePushDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
