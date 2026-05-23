-- CreateIndex
CREATE INDEX "ApiKey_orgId_isActive_createdAt_idx" ON "ApiKey"("orgId", "isActive", "createdAt");

-- CreateIndex
CREATE INDEX "Asset_orgId_createdAt_idx" ON "Asset"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Asset_orgId_assetType_createdAt_idx" ON "Asset"("orgId", "assetType", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_action_createdAt_idx" ON "AuditLog"("orgId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_entityType_createdAt_idx" ON "AuditLog"("orgId", "entityType", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX "Building_propertyId_isActive_deletedAt_idx" ON "Building"("propertyId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_orgId_active_propertyId_idx" ON "CaretakerAssignment"("orgId", "active", "propertyId");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_orgId_active_buildingId_idx" ON "CaretakerAssignment"("orgId", "active", "buildingId");

-- CreateIndex
CREATE INDEX "Inspection_inspectorUserId_scheduledAt_idx" ON "Inspection"("inspectorUserId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Inspection_status_scheduledAt_idx" ON "Inspection"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Invitation_orgId_status_idx" ON "Invitation"("orgId", "status");

-- CreateIndex
CREATE INDEX "Invitation_orgId_role_status_idx" ON "Invitation"("orgId", "role", "status");

-- CreateIndex
CREATE INDEX "IssueTicket_orgId_createdAt_idx" ON "IssueTicket"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "IssueTicket_orgId_updatedAt_idx" ON "IssueTicket"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "IssueTicket_orgId_assignedToUserId_status_idx" ON "IssueTicket"("orgId", "assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "IssueTicket_orgId_propertyId_status_idx" ON "IssueTicket"("orgId", "propertyId", "status");

-- CreateIndex
CREATE INDEX "IssueTicket_orgId_unitId_status_idx" ON "IssueTicket"("orgId", "unitId", "status");

-- CreateIndex
CREATE INDEX "LandlordAssignment_orgId_active_landlordProfileId_idx" ON "LandlordAssignment"("orgId", "active", "landlordProfileId");

-- CreateIndex
CREATE INDEX "LandlordProfile_orgId_isActive_deletedAt_idx" ON "LandlordProfile"("orgId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Lease_orgId_createdAt_idx" ON "Lease"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Lease_orgId_updatedAt_idx" ON "Lease"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "Lease_orgId_tenantId_status_idx" ON "Lease"("orgId", "tenantId", "status");

-- CreateIndex
CREATE INDEX "Lease_orgId_unitId_status_idx" ON "Lease"("orgId", "unitId", "status");

-- CreateIndex
CREATE INDEX "Lease_orgId_dueDay_status_idx" ON "Lease"("orgId", "dueDay", "status");

-- CreateIndex
CREATE INDEX "Membership_orgId_role_scopeType_scopeId_idx" ON "Membership"("orgId", "role", "scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "MeterReading_unitId_period_status_idx" ON "MeterReading"("unitId", "period", "status");

-- CreateIndex
CREATE INDEX "MeterReading_approvedByUserId_approvedAt_idx" ON "MeterReading"("approvedByUserId", "approvedAt");

-- CreateIndex
CREATE INDEX "MoveOutNotice_tenantId_moveOutDate_idx" ON "MoveOutNotice"("tenantId", "moveOutDate");

-- CreateIndex
CREATE INDEX "MoveOutNotice_leaseId_moveOutDate_idx" ON "MoveOutNotice"("leaseId", "moveOutDate");

-- CreateIndex
CREATE INDEX "Notification_orgId_status_createdAt_idx" ON "Notification"("orgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_orgId_channel_status_idx" ON "Notification"("orgId", "channel", "status");

-- CreateIndex
CREATE INDEX "Notification_tenantId_readAt_idx" ON "Notification"("tenantId", "readAt");

-- CreateIndex
CREATE INDEX "Organization_createdAt_idx" ON "Organization"("createdAt");

-- CreateIndex
CREATE INDEX "Organization_updatedAt_idx" ON "Organization"("updatedAt");

-- CreateIndex
CREATE INDEX "Payment_orgId_updatedAt_idx" ON "Payment"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "Payment_orgId_paidAt_idx" ON "Payment"("orgId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_orgId_targetType_createdAt_idx" ON "Payment"("orgId", "targetType", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_orgId_method_createdAt_idx" ON "Payment"("orgId", "method", "createdAt");

-- CreateIndex
CREATE INDEX "Property_orgId_isActive_deletedAt_name_idx" ON "Property"("orgId", "isActive", "deletedAt", "name");

-- CreateIndex
CREATE INDEX "RentCharge_orgId_createdAt_idx" ON "RentCharge"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "RentCharge_orgId_updatedAt_idx" ON "RentCharge"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "RentCharge_orgId_period_status_idx" ON "RentCharge"("orgId", "period", "status");

-- CreateIndex
CREATE INDEX "RentCharge_orgId_leaseId_period_idx" ON "RentCharge"("orgId", "leaseId", "period");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_orgId_createdAt_idx" ON "RentalIncomeReturn"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_orgId_updatedAt_idx" ON "RentalIncomeReturn"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_orgId_period_status_idx" ON "RentalIncomeReturn"("orgId", "period", "status");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_orgId_taxpayerPin_period_idx" ON "RentalIncomeReturn"("orgId", "taxpayerPin", "period");

-- CreateIndex
CREATE INDEX "RentalIncomeReturnItem_rentalReturnId_propertyId_idx" ON "RentalIncomeReturnItem"("rentalReturnId", "propertyId");

-- CreateIndex
CREATE INDEX "RentalIncomeReturnItem_propertyId_unitId_idx" ON "RentalIncomeReturnItem"("propertyId", "unitId");

-- CreateIndex
CREATE INDEX "Subscription_orgId_status_idx" ON "Subscription"("orgId", "status");

-- CreateIndex
CREATE INDEX "TaxCharge_orgId_createdAt_idx" ON "TaxCharge"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "TaxCharge_orgId_updatedAt_idx" ON "TaxCharge"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "TaxCharge_orgId_period_status_idx" ON "TaxCharge"("orgId", "period", "status");

-- CreateIndex
CREATE INDEX "TaxCharge_orgId_taxType_period_idx" ON "TaxCharge"("orgId", "taxType", "period");

-- CreateIndex
CREATE INDEX "TaxpayerProfile_orgId_isActive_deletedAt_idx" ON "TaxpayerProfile"("orgId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Tenant_orgId_createdAt_idx" ON "Tenant"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Tenant_orgId_updatedAt_idx" ON "Tenant"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "Tenant_orgId_status_fullName_idx" ON "Tenant"("orgId", "status", "fullName");

-- CreateIndex
CREATE INDEX "Tenant_orgId_phone_idx" ON "Tenant"("orgId", "phone");

-- CreateIndex
CREATE INDEX "Tenant_orgId_email_idx" ON "Tenant"("orgId", "email");

-- CreateIndex
CREATE INDEX "TenantActionLog_orgId_action_createdAt_idx" ON "TenantActionLog"("orgId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "TenantActionLog_orgId_actorUserId_createdAt_idx" ON "TenantActionLog"("orgId", "actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Unit_propertyId_houseNo_idx" ON "Unit"("propertyId", "houseNo");

-- CreateIndex
CREATE INDEX "Unit_propertyId_createdAt_idx" ON "Unit"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "Unit_buildingId_status_idx" ON "Unit"("buildingId", "status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");

-- CreateIndex
CREATE INDEX "UserSession_userId_expiresAt_idx" ON "UserSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_activeMembershipId_expiresAt_idx" ON "UserSession"("activeMembershipId", "expiresAt");

-- CreateIndex
CREATE INDEX "WaterBill_orgId_createdAt_idx" ON "WaterBill"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "WaterBill_orgId_updatedAt_idx" ON "WaterBill"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "WaterBill_orgId_period_status_idx" ON "WaterBill"("orgId", "period", "status");

-- CreateIndex
CREATE INDEX "WaterBill_orgId_dueDate_status_idx" ON "WaterBill"("orgId", "dueDate", "status");
