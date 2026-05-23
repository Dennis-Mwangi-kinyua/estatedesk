-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'SUPER_ADMIN', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "PlatformPermissionType" AS ENUM ('VIEW_PLATFORM_DASHBOARD', 'VIEW_ORGANIZATIONS', 'CREATE_ORGANIZATIONS', 'EDIT_ORGANIZATIONS', 'SUSPEND_ORGANIZATIONS', 'VIEW_PLATFORM_USERS', 'CREATE_PLATFORM_ADMINS', 'EDIT_PLATFORM_ADMINS', 'DISABLE_PLATFORM_ADMINS', 'VIEW_AUDIT_LOGS', 'VIEW_BILLING', 'MANAGE_BILLING', 'VIEW_REPORTS', 'EXPORT_REPORTS', 'MANAGE_SYSTEM_SETTINGS');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('ADMIN', 'MANAGER', 'OFFICE', 'ACCOUNTANT', 'CARETAKER', 'TENANT');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('ORG', 'PROPERTY', 'BUILDING', 'UNIT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE', 'GODOWN');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('APARTMENT', 'BEDSITTER', 'SHOP', 'OFFICE', 'STALL', 'WAREHOUSE', 'GODOWN');

-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('VACANT', 'OCCUPIED', 'RESERVED', 'UNDER_MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('RENT', 'DEPOSIT', 'WATER', 'PENALTY', 'SERVICE_CHARGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('ISSUED', 'PAYMENT_PENDING', 'PAID_PENDING_VERIFICATION', 'PAID_VERIFIED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MPESA_STK', 'BANK', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentTargetType" AS ENUM ('RENT', 'WATER', 'DEPOSIT', 'TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "GatewayStatus" AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('SUBMITTED', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RENT_DUE_REMINDER', 'RENT_OVERDUE_REMINDER', 'WATER_BILL_ISSUED', 'PAYMENT_RECEIVED', 'PAYMENT_VERIFIED', 'INSPECTION_SCHEDULED', 'MOVE_OUT_CLOSED', 'ISSUE_CREATED', 'ISSUE_RESOLVED', 'GENERAL');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('PROFILE_IMAGE', 'CONTRACT', 'PHOTO', 'DOCUMENT', 'GENERIC');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('WITHHOLDING_TAX', 'VAT', 'RENTAL_INCOME_TAX', 'PAYE', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM ('FREE', 'PRO', 'PLUS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'USER',
    "canCreatePlatformAdmins" BOOLEAN NOT NULL DEFAULT false,
    "isRootSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" TIMESTAMP(3),
    "phoneVerified" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "PlatformPermissionType" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "currencyCode" TEXT NOT NULL DEFAULT 'KES',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 2555,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSettings" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "branding" JSONB,
    "features" JSONB,
    "customFields" JSONB,
    "notificationDefaults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "plan" "BillingPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "trialStartsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "mpesaPaybill" TEXT,
    "stripeSubscriptionId" TEXT,
    "billingEmail" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlanChange" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "fromPlan" "BillingPlan",
    "toPlan" "BillingPlan" NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlanChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT,
    "key" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "metadata" JSONB,
    "assetType" "AssetType" NOT NULL DEFAULT 'GENERIC',
    "uploadedByUserId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "scopeType" "ScopeType" NOT NULL DEFAULT 'ORG',
    "scopeId" TEXT NOT NULL DEFAULT 'ORG_SCOPE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "type" "PropertyType" NOT NULL DEFAULT 'RESIDENTIAL',
    "waterRatePerUnit" DECIMAL(10,2),
    "waterFixedCharge" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "houseNo" TEXT NOT NULL,
    "type" "UnitType" NOT NULL DEFAULT 'APARTMENT',
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floorArea" DOUBLE PRECISION,
    "rentAmount" DECIMAL(12,2) NOT NULL,
    "depositAmount" DECIMAL(12,2),
    "status" "UnitStatus" NOT NULL DEFAULT 'VACANT',
    "vacantSince" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "TenantType" NOT NULL DEFAULT 'INDIVIDUAL',
    "fullName" TEXT NOT NULL,
    "companyName" TEXT,
    "kraPin" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "nationalId" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "dataConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentUpdatedAt" TIMESTAMP(3),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "profileImageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NextOfKin" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "NextOfKin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "caretakerUserId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "dueDay" INTEGER NOT NULL DEFAULT 5,
    "monthlyRent" DECIMAL(12,2) NOT NULL,
    "deposit" DECIMAL(12,2),
    "status" "LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "contractDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaretakerAssignment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "caretakerUserId" TEXT NOT NULL,
    "propertyId" TEXT,
    "buildingId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaretakerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentCharge" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'UNPAID',
    "chargeType" "ChargeType" NOT NULL DEFAULT 'RENT',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "prevReading" INTEGER NOT NULL,
    "currentReading" INTEGER NOT NULL,
    "unitsUsed" INTEGER NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoAssetId" TEXT,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterBill" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "unitsUsed" INTEGER NOT NULL,
    "ratePerUnit" DECIMAL(10,2) NOT NULL,
    "fixedCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCharge" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "propertyId" TEXT,
    "leaseId" TEXT,
    "tenantId" TEXT,
    "taxType" "TaxType" NOT NULL,
    "taxAuthority" TEXT NOT NULL DEFAULT 'KRA',
    "taxAccountNumber" TEXT,
    "period" TEXT NOT NULL,
    "baseAmount" DECIMAL(12,2),
    "taxRate" DECIMAL(5,2),
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "TaxStatus" NOT NULL DEFAULT 'PENDING',
    "assessmentRef" TEXT,
    "kraPaymentRef" TEXT,
    "kraReceiptNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "payerTenantId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "externalReference" TEXT,
    "targetType" "PaymentTargetType" NOT NULL,
    "rentChargeId" TEXT,
    "waterBillId" TEXT,
    "taxChargeId" TEXT,
    "gatewayStatus" "GatewayStatus" NOT NULL DEFAULT 'INITIATED',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutRequestId" TEXT,
    "merchantRequestId" TEXT,
    "phoneUsed" TEXT,
    "callbackRaw" JSONB,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "remittedToKra" BOOLEAN NOT NULL DEFAULT false,
    "remittedAt" TIMESTAMP(3),
    "kraReference" TEXT,
    "kraReceiptNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "providerResponse" JSONB,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoveOutNotice" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "noticeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moveOutDate" TIMESTAMP(3) NOT NULL,
    "status" "NoticeStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoveOutNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "inspectorUserId" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "checklist" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueTicket" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,
    "reportedByUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoAssetId" TEXT,

    CONSTRAINT "IssueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "beforeState" JSONB,
    "afterState" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "scopeType" "ScopeType" NOT NULL DEFAULT 'ORG',
    "scopeId" TEXT NOT NULL DEFAULT 'ORG_SCOPE',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_platformRole_idx" ON "User"("platformRole");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_createdByUserId_idx" ON "User"("createdByUserId");

-- CreateIndex
CREATE INDEX "User_isRootSuperAdmin_idx" ON "User"("isRootSuperAdmin");

-- CreateIndex
CREATE INDEX "PlatformPermission_userId_idx" ON "PlatformPermission"("userId");

-- CreateIndex
CREATE INDEX "PlatformPermission_permission_idx" ON "PlatformPermission"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPermission_userId_permission_key" ON "PlatformPermission"("userId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "Organization_deletedAt_idx" ON "Organization"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_orgId_key" ON "OrganizationSettings"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_orgId_key" ON "Subscription"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_plan_idx" ON "Subscription"("plan");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "SubscriptionPlanChange_subscriptionId_idx" ON "SubscriptionPlanChange"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPlanChange_toPlan_idx" ON "SubscriptionPlanChange"("toPlan");

-- CreateIndex
CREATE INDEX "SubscriptionPlanChange_effectiveFrom_idx" ON "SubscriptionPlanChange"("effectiveFrom");

-- CreateIndex
CREATE INDEX "Asset_orgId_idx" ON "Asset"("orgId");

-- CreateIndex
CREATE INDEX "Asset_assetType_idx" ON "Asset"("assetType");

-- CreateIndex
CREATE INDEX "Asset_key_idx" ON "Asset"("key");

-- CreateIndex
CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");

-- CreateIndex
CREATE INDEX "Membership_orgId_idx" ON "Membership"("orgId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_role_idx" ON "Membership"("role");

-- CreateIndex
CREATE INDEX "Membership_scopeType_scopeId_idx" ON "Membership"("scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_orgId_userId_role_scopeType_scopeId_key" ON "Membership"("orgId", "userId", "role", "scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "Property_orgId_idx" ON "Property"("orgId");

-- CreateIndex
CREATE INDEX "Property_isActive_idx" ON "Property"("isActive");

-- CreateIndex
CREATE INDEX "Property_deletedAt_idx" ON "Property"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Property_orgId_name_key" ON "Property"("orgId", "name");

-- CreateIndex
CREATE INDEX "Building_propertyId_idx" ON "Building"("propertyId");

-- CreateIndex
CREATE INDEX "Building_isActive_idx" ON "Building"("isActive");

-- CreateIndex
CREATE INDEX "Building_deletedAt_idx" ON "Building"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Building_propertyId_name_key" ON "Building"("propertyId", "name");

-- CreateIndex
CREATE INDEX "Unit_propertyId_idx" ON "Unit"("propertyId");

-- CreateIndex
CREATE INDEX "Unit_buildingId_idx" ON "Unit"("buildingId");

-- CreateIndex
CREATE INDEX "Unit_status_idx" ON "Unit"("status");

-- CreateIndex
CREATE INDEX "Unit_isActive_idx" ON "Unit"("isActive");

-- CreateIndex
CREATE INDEX "Unit_deletedAt_idx" ON "Unit"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_userId_key" ON "Tenant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_profileImageId_key" ON "Tenant"("profileImageId");

-- CreateIndex
CREATE INDEX "Tenant_orgId_idx" ON "Tenant"("orgId");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_fullName_idx" ON "Tenant"("fullName");

-- CreateIndex
CREATE INDEX "Tenant_nationalId_idx" ON "Tenant"("nationalId");

-- CreateIndex
CREATE INDEX "Tenant_deletedAt_idx" ON "Tenant"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_orgId_phone_key" ON "Tenant"("orgId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_orgId_email_key" ON "Tenant"("orgId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "NextOfKin_tenantId_key" ON "NextOfKin"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Lease_contractDocumentId_key" ON "Lease"("contractDocumentId");

-- CreateIndex
CREATE INDEX "Lease_orgId_idx" ON "Lease"("orgId");

-- CreateIndex
CREATE INDEX "Lease_unitId_idx" ON "Lease"("unitId");

-- CreateIndex
CREATE INDEX "Lease_tenantId_idx" ON "Lease"("tenantId");

-- CreateIndex
CREATE INDEX "Lease_caretakerUserId_idx" ON "Lease"("caretakerUserId");

-- CreateIndex
CREATE INDEX "Lease_status_unitId_idx" ON "Lease"("status", "unitId");

-- CreateIndex
CREATE INDEX "Lease_status_tenantId_idx" ON "Lease"("status", "tenantId");

-- CreateIndex
CREATE INDEX "Lease_startDate_idx" ON "Lease"("startDate");

-- CreateIndex
CREATE INDEX "Lease_endDate_idx" ON "Lease"("endDate");

-- CreateIndex
CREATE INDEX "Lease_deletedAt_idx" ON "Lease"("deletedAt");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_orgId_idx" ON "CaretakerAssignment"("orgId");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_caretakerUserId_idx" ON "CaretakerAssignment"("caretakerUserId");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_propertyId_idx" ON "CaretakerAssignment"("propertyId");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_buildingId_idx" ON "CaretakerAssignment"("buildingId");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_active_idx" ON "CaretakerAssignment"("active");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_caretakerUserId_active_propertyId_idx" ON "CaretakerAssignment"("caretakerUserId", "active", "propertyId");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_caretakerUserId_active_buildingId_idx" ON "CaretakerAssignment"("caretakerUserId", "active", "buildingId");

-- CreateIndex
CREATE INDEX "RentCharge_orgId_idx" ON "RentCharge"("orgId");

-- CreateIndex
CREATE INDEX "RentCharge_leaseId_status_idx" ON "RentCharge"("leaseId", "status");

-- CreateIndex
CREATE INDEX "RentCharge_period_status_idx" ON "RentCharge"("period", "status");

-- CreateIndex
CREATE INDEX "RentCharge_dueDate_idx" ON "RentCharge"("dueDate");

-- CreateIndex
CREATE INDEX "RentCharge_chargeType_idx" ON "RentCharge"("chargeType");

-- CreateIndex
CREATE UNIQUE INDEX "RentCharge_leaseId_period_chargeType_key" ON "RentCharge"("leaseId", "period", "chargeType");

-- CreateIndex
CREATE INDEX "MeterReading_unitId_status_idx" ON "MeterReading"("unitId", "status");

-- CreateIndex
CREATE INDEX "MeterReading_period_status_idx" ON "MeterReading"("period", "status");

-- CreateIndex
CREATE INDEX "MeterReading_submittedByUserId_createdAt_idx" ON "MeterReading"("submittedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "MeterReading_status_createdAt_idx" ON "MeterReading"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MeterReading_unitId_period_key" ON "MeterReading"("unitId", "period");

-- CreateIndex
CREATE INDEX "WaterBill_orgId_idx" ON "WaterBill"("orgId");

-- CreateIndex
CREATE INDEX "WaterBill_tenantId_period_idx" ON "WaterBill"("tenantId", "period");

-- CreateIndex
CREATE INDEX "WaterBill_unitId_period_idx" ON "WaterBill"("unitId", "period");

-- CreateIndex
CREATE INDEX "WaterBill_status_idx" ON "WaterBill"("status");

-- CreateIndex
CREATE INDEX "WaterBill_dueDate_idx" ON "WaterBill"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "WaterBill_unitId_period_key" ON "WaterBill"("unitId", "period");

-- CreateIndex
CREATE INDEX "TaxCharge_orgId_idx" ON "TaxCharge"("orgId");

-- CreateIndex
CREATE INDEX "TaxCharge_propertyId_idx" ON "TaxCharge"("propertyId");

-- CreateIndex
CREATE INDEX "TaxCharge_leaseId_idx" ON "TaxCharge"("leaseId");

-- CreateIndex
CREATE INDEX "TaxCharge_tenantId_idx" ON "TaxCharge"("tenantId");

-- CreateIndex
CREATE INDEX "TaxCharge_taxType_idx" ON "TaxCharge"("taxType");

-- CreateIndex
CREATE INDEX "TaxCharge_status_idx" ON "TaxCharge"("status");

-- CreateIndex
CREATE INDEX "TaxCharge_dueDate_idx" ON "TaxCharge"("dueDate");

-- CreateIndex
CREATE INDEX "TaxCharge_period_idx" ON "TaxCharge"("period");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutRequestId_key" ON "Payment"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "Payment_orgId_createdAt_idx" ON "Payment"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_payerTenantId_createdAt_idx" ON "Payment"("payerTenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_gatewayStatus_verificationStatus_idx" ON "Payment"("gatewayStatus", "verificationStatus");

-- CreateIndex
CREATE INDEX "Payment_rentChargeId_idx" ON "Payment"("rentChargeId");

-- CreateIndex
CREATE INDEX "Payment_waterBillId_idx" ON "Payment"("waterBillId");

-- CreateIndex
CREATE INDEX "Payment_taxChargeId_idx" ON "Payment"("taxChargeId");

-- CreateIndex
CREATE INDEX "Payment_reference_idx" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_externalReference_idx" ON "Payment"("externalReference");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex
CREATE INDEX "Payment_remittedToKra_remittedAt_idx" ON "Payment"("remittedToKra", "remittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_paymentId_key" ON "Receipt"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");

-- CreateIndex
CREATE INDEX "Notification_orgId_createdAt_idx" ON "Notification"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_status_channel_idx" ON "Notification"("status", "channel");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- CreateIndex
CREATE INDEX "MoveOutNotice_leaseId_status_idx" ON "MoveOutNotice"("leaseId", "status");

-- CreateIndex
CREATE INDEX "MoveOutNotice_tenantId_status_idx" ON "MoveOutNotice"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MoveOutNotice_moveOutDate_idx" ON "MoveOutNotice"("moveOutDate");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_noticeId_key" ON "Inspection"("noticeId");

-- CreateIndex
CREATE INDEX "Inspection_scheduledAt_idx" ON "Inspection"("scheduledAt");

-- CreateIndex
CREATE INDEX "Inspection_status_idx" ON "Inspection"("status");

-- CreateIndex
CREATE INDEX "IssueTicket_orgId_status_priority_idx" ON "IssueTicket"("orgId", "status", "priority");

-- CreateIndex
CREATE INDEX "IssueTicket_propertyId_idx" ON "IssueTicket"("propertyId");

-- CreateIndex
CREATE INDEX "IssueTicket_unitId_idx" ON "IssueTicket"("unitId");

-- CreateIndex
CREATE INDEX "IssueTicket_reportedByUserId_idx" ON "IssueTicket"("reportedByUserId");

-- CreateIndex
CREATE INDEX "IssueTicket_assignedToUserId_idx" ON "IssueTicket"("assignedToUserId");

-- CreateIndex
CREATE INDEX "IssueTicket_resolvedAt_idx" ON "IssueTicket"("resolvedAt");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_orgId_idx" ON "Invitation"("orgId");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_expiresAt_idx" ON "Invitation"("expiresAt");

-- CreateIndex
CREATE INDEX "ApiKey_orgId_idx" ON "ApiKey"("orgId");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPermission" ADD CONSTRAINT "PlatformPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlanChange" ADD CONSTRAINT "SubscriptionPlanChange_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_profileImageId_fkey" FOREIGN KEY ("profileImageId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NextOfKin" ADD CONSTRAINT "NextOfKin_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_contractDocumentId_fkey" FOREIGN KEY ("contractDocumentId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_caretakerUserId_fkey" FOREIGN KEY ("caretakerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaretakerAssignment" ADD CONSTRAINT "CaretakerAssignment_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaretakerAssignment" ADD CONSTRAINT "CaretakerAssignment_caretakerUserId_fkey" FOREIGN KEY ("caretakerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaretakerAssignment" ADD CONSTRAINT "CaretakerAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaretakerAssignment" ADD CONSTRAINT "CaretakerAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentCharge" ADD CONSTRAINT "RentCharge_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentCharge" ADD CONSTRAINT "RentCharge_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_photoAssetId_fkey" FOREIGN KEY ("photoAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterBill" ADD CONSTRAINT "WaterBill_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterBill" ADD CONSTRAINT "WaterBill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterBill" ADD CONSTRAINT "WaterBill_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCharge" ADD CONSTRAINT "TaxCharge_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCharge" ADD CONSTRAINT "TaxCharge_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCharge" ADD CONSTRAINT "TaxCharge_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCharge" ADD CONSTRAINT "TaxCharge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerTenantId_fkey" FOREIGN KEY ("payerTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentChargeId_fkey" FOREIGN KEY ("rentChargeId") REFERENCES "RentCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_waterBillId_fkey" FOREIGN KEY ("waterBillId") REFERENCES "WaterBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_taxChargeId_fkey" FOREIGN KEY ("taxChargeId") REFERENCES "TaxCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveOutNotice" ADD CONSTRAINT "MoveOutNotice_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveOutNotice" ADD CONSTRAINT "MoveOutNotice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_inspectorUserId_fkey" FOREIGN KEY ("inspectorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "MoveOutNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_photoAssetId_fkey" FOREIGN KEY ("photoAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
