-- CreateIndex
CREATE INDEX "Lease_orgId_status_deletedAt_idx" ON "Lease"("orgId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Membership_userId_orgId_role_idx" ON "Membership"("userId", "orgId", "role");

-- CreateIndex
CREATE INDEX "Membership_userId_role_createdAt_idx" ON "Membership"("userId", "role", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_orgId_readAt_idx" ON "Notification"("orgId", "readAt");

-- CreateIndex
CREATE INDEX "Payment_orgId_gatewayStatus_verificationStatus_idx" ON "Payment"("orgId", "gatewayStatus", "verificationStatus");

-- CreateIndex
CREATE INDEX "Property_orgId_deletedAt_idx" ON "Property"("orgId", "deletedAt");

-- CreateIndex
CREATE INDEX "RentCharge_orgId_status_dueDate_idx" ON "RentCharge"("orgId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Tenant_orgId_deletedAt_status_idx" ON "Tenant"("orgId", "deletedAt", "status");

-- CreateIndex
CREATE INDEX "Unit_propertyId_isActive_deletedAt_status_idx" ON "Unit"("propertyId", "isActive", "deletedAt", "status");

-- CreateIndex
CREATE INDEX "WaterBill_orgId_status_idx" ON "WaterBill"("orgId", "status");
