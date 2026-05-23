import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  Prisma,
  UserStatus,
  PlatformRole,
  PlatformPermissionType,
  OrganizationStatus,
  OrgRole,
  ScopeType,
  PropertyType,
  UnitType,
  TenantType,
  TenantStatus,
  UnitStatus,
  LeaseStatus,
  ChargeStatus,
  ChargeType,
  ReadingStatus,
  BillStatus,
  PaymentMethod,
  PaymentTargetType,
  GatewayStatus,
  VerificationStatus,
  NoticeStatus,
  InspectionStatus,
  TicketPriority,
  TicketStatus,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  AssetType,
  TaxType,
  TaxStatus,
  BillingPlan,
  SubscriptionStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Password@123";

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("🌱 Seeding started...");

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // ------------------------------
  // CLEANUP (children first)
  // ------------------------------
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.moveOutNotice.deleteMany();
  await prisma.issueTicket.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.waterBill.deleteMany();
  await prisma.rentCharge.deleteMany();
  await prisma.taxCharge.deleteMany();
  await prisma.caretakerAssignment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.platformPermission.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.nextOfKin.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.subscriptionPlanChange.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.property.deleteMany();
  await prisma.organizationSettings.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // ------------------------------
  // USERS
  // ------------------------------
  const superAdmin = await prisma.user.create({
    data: {
      fullName: "Root Super Admin",
      phone: "+254700000001",
      email: "root@estatedesk.com",
      passwordHash,
      status: UserStatus.ACTIVE,
      platformRole: PlatformRole.SUPER_ADMIN,
      canCreatePlatformAdmins: true,
      isRootSuperAdmin: true,
      emailVerified: new Date(),
      phoneVerified: new Date(),
      twoFactorEnabled: true,
      lastLoginAt: new Date(),
    },
  });

  const platformAdmin = await prisma.user.create({
    data: {
      fullName: "Platform Admin",
      phone: "+254700000002",
      email: "platform.admin@estatedesk.com",
      passwordHash,
      status: UserStatus.ACTIVE,
      platformRole: PlatformRole.PLATFORM_ADMIN,
      canCreatePlatformAdmins: true,
      createdByUserId: superAdmin.id,
      emailVerified: new Date(),
      phoneVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const orgAdminUser = await prisma.user.create({
    data: {
      fullName: "Alice Landlord",
      phone: "+254700000003",
      email: "alice@greenholdings.co.ke",
      passwordHash,
      status: UserStatus.ACTIVE,
      platformRole: PlatformRole.USER,
      createdByUserId: platformAdmin.id,
      emailVerified: new Date(),
      phoneVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      fullName: "Brian Manager",
      phone: "+254700000004",
      email: "brian@greenholdings.co.ke",
      passwordHash,
      status: UserStatus.ACTIVE,
      platformRole: PlatformRole.USER,
      createdByUserId: orgAdminUser.id,
      emailVerified: new Date(),
      phoneVerified: new Date(),
    },
  });

  const officeUser = await prisma.user.create({
    data: {
      fullName: "Cynthia Office",
      phone: "+254700000005",
      email: "office@greenholdings.co.ke",
      passwordHash,
      status: UserStatus.ACTIVE,
      platformRole: PlatformRole.USER,
      createdByUserId: orgAdminUser.id,
      emailVerified: new Date(),
      phoneVerified: new Date(),
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      fullName: "David Accountant",
      phone: "+254700000006",
      email: "accounts@greenholdings.co.ke",
      passwordHash,
      status: UserStatus.ACTIVE,
      platformRole: PlatformRole.USER,
      createdByUserId: orgAdminUser.id,
      emailVerified: new Date(),
      phoneVerified: new Date(),
    },
  });

  const caretakerUser = await prisma.user.create({
    data: {
      fullName: "Evan Caretaker",
      phone: "+254700000007",
      email: "caretaker@greenholdings.co.ke",
      passwordHash,
      status: UserStatus.ACTIVE,
      platformRole: PlatformRole.USER,
      createdByUserId: managerUser.id,
      emailVerified: new Date(),
      phoneVerified: new Date(),
    },
  });

  const tenantUser = await prisma.user.create({
    data: {
      fullName: "Faith Tenant",
      phone: "+254700000008",
      email: "faith.tenant@gmail.com",
      passwordHash,
      status: UserStatus.ACTIVE,
      platformRole: PlatformRole.USER,
      createdByUserId: officeUser.id,
      emailVerified: new Date(),
      phoneVerified: new Date(),
    },
  });

  // ------------------------------
  // PLATFORM PERMISSIONS
  // ------------------------------
  await prisma.platformPermission.createMany({
    data: [
      {
        userId: superAdmin.id,
        permission: PlatformPermissionType.VIEW_PLATFORM_DASHBOARD,
        granted: true,
      },
      {
        userId: superAdmin.id,
        permission: PlatformPermissionType.VIEW_ORGANIZATIONS,
        granted: true,
      },
      {
        userId: superAdmin.id,
        permission: PlatformPermissionType.CREATE_ORGANIZATIONS,
        granted: true,
      },
      {
        userId: superAdmin.id,
        permission: PlatformPermissionType.EDIT_ORGANIZATIONS,
        granted: true,
      },
      {
        userId: superAdmin.id,
        permission: PlatformPermissionType.VIEW_PLATFORM_USERS,
        granted: true,
      },
      {
        userId: superAdmin.id,
        permission: PlatformPermissionType.VIEW_AUDIT_LOGS,
        granted: true,
      },
      {
        userId: platformAdmin.id,
        permission: PlatformPermissionType.VIEW_PLATFORM_DASHBOARD,
        granted: true,
      },
      {
        userId: platformAdmin.id,
        permission: PlatformPermissionType.VIEW_ORGANIZATIONS,
        granted: true,
      },
      {
        userId: platformAdmin.id,
        permission: PlatformPermissionType.VIEW_REPORTS,
        granted: true,
      },
      {
        userId: platformAdmin.id,
        permission: PlatformPermissionType.EXPORT_REPORTS,
        granted: true,
      },
    ],
  });

  // ------------------------------
  // ORGANIZATION
  // ------------------------------
  const org = await prisma.organization.create({
    data: {
      name: "Green Holdings Ltd",
      slug: "green-holdings",
      phone: "+254711111111",
      email: "info@greenholdings.co.ke",
      address: "Westlands, Nairobi",
      status: OrganizationStatus.ACTIVE,
      currencyCode: "KES",
      timezone: "Africa/Nairobi",
      dataRetentionDays: 2555,
    },
  });

  await prisma.organizationSettings.create({
    data: {
      orgId: org.id,
      branding: {
        primaryColor: "#0f766e",
        logoUrl: "https://example.com/logo.png",
      },
      features: {
        billing: true,
        waterBilling: true,
        inspections: true,
        tickets: true,
      },
      customFields: {
        tenant: ["occupation", "emergencyContactAlt"],
      },
      notificationDefaults: {
        sms: true,
        email: true,
        inApp: true,
      },
    },
  });

  const subscription = await prisma.subscription.create({
    data: {
      orgId: org.id,
      plan: BillingPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-03-31T23:59:59.999Z"),
      billingEmail: "billing@greenholdings.co.ke",
      mpesaPaybill: "123456",
      metadata: {
        seats: 25,
        source: "manual-seed",
      },
    },
  });

  await prisma.subscriptionPlanChange.create({
    data: {
      subscriptionId: subscription.id,
      fromPlan: BillingPlan.FREE,
      toPlan: BillingPlan.PRO,
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      reason: "Upgraded after trial",
      metadata: {
        upgradedBy: orgAdminUser.email,
      },
    },
  });

  // ------------------------------
  // MEMBERSHIPS
  // ------------------------------
  await prisma.membership.createMany({
    data: [
      {
        orgId: org.id,
        userId: orgAdminUser.id,
        role: OrgRole.ADMIN,
        scopeType: ScopeType.ORG,
        scopeId: "ORG_SCOPE",
      },
      {
        orgId: org.id,
        userId: managerUser.id,
        role: OrgRole.MANAGER,
        scopeType: ScopeType.ORG,
        scopeId: "ORG_SCOPE",
      },
      {
        orgId: org.id,
        userId: officeUser.id,
        role: OrgRole.OFFICE,
        scopeType: ScopeType.ORG,
        scopeId: "ORG_SCOPE",
      },
      {
        orgId: org.id,
        userId: accountantUser.id,
        role: OrgRole.ACCOUNTANT,
        scopeType: ScopeType.ORG,
        scopeId: "ORG_SCOPE",
      },
      {
        orgId: org.id,
        userId: caretakerUser.id,
        role: OrgRole.CARETAKER,
        scopeType: ScopeType.ORG,
        scopeId: "ORG_SCOPE",
      },
      {
        orgId: org.id,
        userId: tenantUser.id,
        role: OrgRole.TENANT,
        scopeType: ScopeType.ORG,
        scopeId: "ORG_SCOPE",
      },
    ],
  });

  // ------------------------------
  // ASSETS
  // ------------------------------
  const tenantProfileImage = await prisma.asset.create({
    data: {
      orgId: org.id,
      fileName: "faith-profile.jpg",
      fileType: "jpg",
      mimeType: "image/jpeg",
      key: "assets/faith-profile.jpg",
      size: 120450,
      assetType: AssetType.PROFILE_IMAGE,
      uploadedByUserId: officeUser.id,
      metadata: {
        alt: "Faith Tenant Profile Photo",
      },
    },
  });

  const leaseContractAsset = await prisma.asset.create({
    data: {
      orgId: org.id,
      fileName: "lease-faith-apt-a1.pdf",
      fileType: "pdf",
      mimeType: "application/pdf",
      key: "contracts/lease-faith-apt-a1.pdf",
      size: 302144,
      assetType: AssetType.CONTRACT,
      uploadedByUserId: officeUser.id,
      metadata: {
        version: 1,
      },
    },
  });

  const meterPhotoAsset = await prisma.asset.create({
    data: {
      orgId: org.id,
      fileName: "meter-reading-2026-03.jpg",
      fileType: "jpg",
      mimeType: "image/jpeg",
      key: "meter/reading-2026-03.jpg",
      size: 183000,
      assetType: AssetType.PHOTO,
      uploadedByUserId: caretakerUser.id,
    },
  });

  const issuePhotoAsset = await prisma.asset.create({
    data: {
      orgId: org.id,
      fileName: "leak-kitchen-a1.jpg",
      fileType: "jpg",
      mimeType: "image/jpeg",
      key: "issues/leak-kitchen-a1.jpg",
      size: 210000,
      assetType: AssetType.PHOTO,
      uploadedByUserId: tenantUser.id,
    },
  });

  // ------------------------------
  // PROPERTY / BUILDING / UNITS
  // ------------------------------
  const property = await prisma.property.create({
    data: {
      orgId: org.id,
      name: "Sunrise Apartments",
      location: "Kilimani",
      address: "Argwings Kodhek Rd, Nairobi",
      notes: "Primary residential property",
      type: PropertyType.RESIDENTIAL,
      waterRatePerUnit: new Prisma.Decimal("75.00"),
      waterFixedCharge: new Prisma.Decimal("250.00"),
      isActive: true,
    },
  });

  const building = await prisma.building.create({
    data: {
      propertyId: property.id,
      name: "Block A",
      notes: "Main residential block",
      isActive: true,
    },
  });

  const occupiedUnit = await prisma.unit.create({
    data: {
      propertyId: property.id,
      buildingId: building.id,
      houseNo: "A1",
      type: UnitType.APARTMENT,
      bedrooms: 2,
      bathrooms: 2,
      floorArea: 85.5,
      rentAmount: new Prisma.Decimal("35000.00"),
      depositAmount: new Prisma.Decimal("70000.00"),
      status: UnitStatus.OCCUPIED,
      isActive: true,
      notes: "Corner unit",
    },
  });

  const vacantUnit = await prisma.unit.create({
    data: {
      propertyId: property.id,
      buildingId: building.id,
      houseNo: "A2",
      type: UnitType.APARTMENT,
      bedrooms: 1,
      bathrooms: 1,
      floorArea: 55.0,
      rentAmount: new Prisma.Decimal("25000.00"),
      depositAmount: new Prisma.Decimal("50000.00"),
      status: UnitStatus.VACANT,
      vacantSince: new Date("2026-03-01T00:00:00.000Z"),
      isActive: true,
    },
  });

  // ------------------------------
  // TENANT / NEXT OF KIN
  // ------------------------------
  const tenant = await prisma.tenant.create({
    data: {
      orgId: org.id,
      userId: tenantUser.id,
      type: TenantType.INDIVIDUAL,
      fullName: "Faith Wanjiku",
      phone: "+254700000008",
      email: "faith.tenant@gmail.com",
      nationalId: "12345678",
      kraPin: "A123456789X",
      status: TenantStatus.ACTIVE,
      notes: "Pays on time",
      dataConsent: true,
      consentUpdatedAt: new Date(),
      marketingConsent: false,
      profileImageId: tenantProfileImage.id,
    },
  });

  await prisma.nextOfKin.create({
    data: {
      tenantId: tenant.id,
      name: "James Wanjiku",
      relationship: "Brother",
      phone: "+254711223344",
      email: "james.wanjiku@gmail.com",
    },
  });

  // ------------------------------
  // LEASE
  // ------------------------------
  const lease = await prisma.lease.create({
    data: {
      orgId: org.id,
      unitId: occupiedUnit.id,
      tenantId: tenant.id,
      caretakerUserId: caretakerUser.id,
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T23:59:59.999Z"),
      dueDay: 5,
      monthlyRent: new Prisma.Decimal("35000.00"),
      deposit: new Prisma.Decimal("70000.00"),
      status: LeaseStatus.ACTIVE,
      notes: "12-month lease agreement",
      contractDocumentId: leaseContractAsset.id,
    },
  });

  // ------------------------------
  // CARETAKER ASSIGNMENT
  // ------------------------------
  await prisma.caretakerAssignment.create({
    data: {
      orgId: org.id,
      caretakerUserId: caretakerUser.id,
      propertyId: property.id,
      buildingId: building.id,
      isPrimary: true,
      active: true,
      assignedAt: new Date("2026-01-01T08:00:00.000Z"),
      notes: "Assigned to oversee Block A",
    },
  });

  // ------------------------------
  // CHARGES / BILLS / TAX
  // ------------------------------
  const rentCharge = await prisma.rentCharge.create({
    data: {
      orgId: org.id,
      leaseId: lease.id,
      period: "2026-03",
      amountDue: new Prisma.Decimal("35000.00"),
      dueDate: new Date("2026-03-05T00:00:00.000Z"),
      amountPaid: new Prisma.Decimal("35000.00"),
      balance: new Prisma.Decimal("0.00"),
      status: ChargeStatus.PAID,
      chargeType: ChargeType.RENT,
      description: "March 2026 rent",
    },
  });

  const meterReading = await prisma.meterReading.create({
    data: {
      unitId: occupiedUnit.id,
      period: "2026-03",
      prevReading: 1200,
      currentReading: 1238,
      unitsUsed: 38,
      status: ReadingStatus.APPROVED,
      submittedByUserId: caretakerUser.id,
      approvedByUserId: managerUser.id,
      approvedAt: new Date(),
      notes: "Reading captured from basement line meter",
      photoAssetId: meterPhotoAsset.id,
    },
  });

  const waterBill = await prisma.waterBill.create({
    data: {
      orgId: org.id,
      unitId: occupiedUnit.id,
      tenantId: tenant.id,
      period: "2026-03",
      unitsUsed: meterReading.unitsUsed,
      ratePerUnit: new Prisma.Decimal("75.00"),
      fixedCharge: new Prisma.Decimal("250.00"),
      total: new Prisma.Decimal("3100.00"),
      dueDate: new Date("2026-03-10T00:00:00.000Z"),
      status: BillStatus.PAID_VERIFIED,
      notes: "March 2026 water bill",
    },
  });

  const taxCharge = await prisma.taxCharge.create({
    data: {
      orgId: org.id,
      propertyId: property.id,
      leaseId: lease.id,
      tenantId: tenant.id,
      taxType: TaxType.WITHHOLDING_TAX,
      taxAuthority: "KRA",
      taxAccountNumber: "KRA-001-XYZ",
      period: "2026-03",
      baseAmount: new Prisma.Decimal("35000.00"),
      taxRate: new Prisma.Decimal("10.00"),
      amountDue: new Prisma.Decimal("3500.00"),
      amountPaid: new Prisma.Decimal("3500.00"),
      balance: new Prisma.Decimal("0.00"),
      dueDate: new Date("2026-03-20T00:00:00.000Z"),
      status: TaxStatus.PAID,
      assessmentRef: "ASM-2026-03-0001",
      kraPaymentRef: "KRA-PAY-202603-001",
      kraReceiptNo: "KRA-RCPT-0001",
      notes: "Monthly withholding tax",
    },
  });

  // ------------------------------
  // PAYMENTS
  // ------------------------------
  const rentPayment = await prisma.payment.create({
    data: {
      orgId: org.id,
      payerTenantId: tenant.id,
      method: PaymentMethod.MPESA_STK,
      amount: new Prisma.Decimal("35000.00"),
      reference: "MPE123RENT",
      externalReference: "EXT-RENT-2026-03",
      targetType: PaymentTargetType.RENT,
      rentChargeId: rentCharge.id,
      gatewayStatus: GatewayStatus.SUCCESS,
      verificationStatus: VerificationStatus.VERIFIED,
      checkoutRequestId: "ws_CO_123456789",
      merchantRequestId: "mr_123456789",
      phoneUsed: tenant.phone,
      callbackRaw: {
        resultCode: 0,
        resultDesc: "Success",
      },
      paidAt: new Date("2026-03-03T10:30:00.000Z"),
      notes: "Rent paid via M-Pesa STK push",
    },
  });

  await prisma.payment.create({
    data: {
      orgId: org.id,
      payerTenantId: tenant.id,
      method: PaymentMethod.CASH,
      amount: new Prisma.Decimal("3100.00"),
      reference: "CSH-WATER-001",
      externalReference: "WATER-2026-03-001",
      targetType: PaymentTargetType.WATER,
      waterBillId: waterBill.id,
      gatewayStatus: GatewayStatus.SUCCESS,
      verificationStatus: VerificationStatus.VERIFIED,
      paidAt: new Date("2026-03-11T09:00:00.000Z"),
      notes: "Paid at office front desk",
    },
  });

  await prisma.payment.create({
    data: {
      orgId: org.id,
      payerTenantId: tenant.id,
      method: PaymentMethod.BANK,
      amount: new Prisma.Decimal("3500.00"),
      reference: "BANK-TAX-001",
      externalReference: "TAX-2026-03-001",
      targetType: PaymentTargetType.TAX,
      taxChargeId: taxCharge.id,
      gatewayStatus: GatewayStatus.SUCCESS,
      verificationStatus: VerificationStatus.VERIFIED,
      paidAt: new Date("2026-03-18T15:45:00.000Z"),
      remittedToKra: true,
      remittedAt: new Date("2026-03-19T08:00:00.000Z"),
      kraReference: "KRA-REF-001",
      kraReceiptNo: "KRA-RCP-001",
      notes: "Tax remitted to KRA",
    },
  });

  // ------------------------------
  // RECEIPT
  // ------------------------------
  await prisma.receipt.create({
    data: {
      paymentId: rentPayment.id,
      receiptNo: "RCT-2026-0001",
      pdfUrl: "https://example.com/receipts/rct-2026-0001.pdf",
      issuedAt: new Date("2026-03-03T10:35:00.000Z"),
    },
  });

  // ------------------------------
  // NOTIFICATIONS
  // ------------------------------
  await prisma.notification.createMany({
    data: [
      {
        orgId: org.id,
        userId: tenantUser.id,
        tenantId: tenant.id,
        channel: NotificationChannel.SMS,
        type: NotificationType.RENT_DUE_REMINDER,
        title: "Rent Due Reminder",
        message: "Your March rent is due on 5th March.",
        status: NotificationStatus.SENT,
        sentAt: new Date("2026-03-01T08:00:00.000Z"),
      },
      {
        orgId: org.id,
        userId: tenantUser.id,
        tenantId: tenant.id,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.WATER_BILL_ISSUED,
        title: "Water Bill Issued",
        message: "Your March water bill of KES 3,100 has been issued.",
        status: NotificationStatus.SENT,
        sentAt: new Date("2026-03-10T09:00:00.000Z"),
      },
      {
        orgId: org.id,
        userId: accountantUser.id,
        channel: NotificationChannel.IN_APP,
        type: NotificationType.PAYMENT_VERIFIED,
        title: "Payment Verified",
        message: "Rent payment for Faith Wanjiku has been verified.",
        status: NotificationStatus.SENT,
        sentAt: new Date("2026-03-03T11:00:00.000Z"),
        readAt: new Date("2026-03-03T11:05:00.000Z"),
      },
    ],
  });

  // ------------------------------
  // MOVE OUT / INSPECTION
  // ------------------------------
  const moveOutNotice = await prisma.moveOutNotice.create({
    data: {
      leaseId: lease.id,
      tenantId: tenant.id,
      noticeDate: new Date("2026-11-01T00:00:00.000Z"),
      moveOutDate: new Date("2026-11-30T00:00:00.000Z"),
      status: NoticeStatus.INSPECTION_SCHEDULED,
      notes: "Tenant has given one-month notice.",
    },
  });

  await prisma.inspection.create({
    data: {
      noticeId: moveOutNotice.id,
      scheduledAt: new Date("2026-11-25T10:00:00.000Z"),
      inspectorUserId: caretakerUser.id,
      status: InspectionStatus.SCHEDULED,
      notes: "Pre-move-out inspection scheduled.",
      checklist: {
        walls: "pending",
        plumbing: "pending",
        electricity: "pending",
        windows: "pending",
      },
    },
  });

  // ------------------------------
  // ISSUE TICKET
  // ------------------------------
  await prisma.issueTicket.create({
    data: {
      orgId: org.id,
      propertyId: property.id,
      unitId: occupiedUnit.id,
      reportedByUserId: tenantUser.id,
      assignedToUserId: caretakerUser.id,
      title: "Kitchen sink leakage",
      description: "There is a persistent leak under the kitchen sink.",
      priority: TicketPriority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      photoAssetId: issuePhotoAsset.id,
    },
  });

  // ------------------------------
  // AUDIT LOG
  // ------------------------------
  await prisma.auditLog.createMany({
    data: [
      {
        orgId: org.id,
        actorUserId: orgAdminUser.id,
        action: "CREATE_LEASE",
        entityType: "Lease",
        entityId: lease.id,
        metadata: {
          source: "seed",
        },
        beforeState: Prisma.JsonNull,
        afterState: {
          status: LeaseStatus.ACTIVE,
          tenantId: tenant.id,
          unitId: occupiedUnit.id,
        },
        ip: "127.0.0.1",
        userAgent: "seed-script",
        requestId: "seed-req-001",
      },
      {
        orgId: org.id,
        actorUserId: accountantUser.id,
        action: "VERIFY_PAYMENT",
        entityType: "Payment",
        entityId: rentPayment.id,
        metadata: {
          paymentType: "rent",
        },
        beforeState: {
          verificationStatus: VerificationStatus.PENDING,
        },
        afterState: {
          verificationStatus: VerificationStatus.VERIFIED,
        },
        ip: "127.0.0.1",
        userAgent: "seed-script",
        requestId: "seed-req-002",
      },
    ],
  });

  // ------------------------------
  // INVITATION
  // ------------------------------
  await prisma.invitation.create({
    data: {
      orgId: org.id,
      email: "new.manager@greenholdings.co.ke",
      role: OrgRole.MANAGER,
      scopeType: ScopeType.ORG,
      scopeId: "ORG_SCOPE",
      token: "invite-token-manager-001",
      expiresAt: new Date("2026-04-30T23:59:59.999Z"),
      status: "PENDING",
      invitedById: orgAdminUser.id,
    },
  });

  // ------------------------------
  // API KEY
  // ------------------------------
  await prisma.apiKey.create({
    data: {
      orgId: org.id,
      name: "Production Integration Key",
      keyHash: "hashed_api_key_value",
      lastUsedAt: new Date("2026-03-20T12:00:00.000Z"),
      expiresAt: new Date("2027-03-20T12:00:00.000Z"),
      permissions: {
        payments: ["read", "write"],
        tenants: ["read"],
        leases: ["read"],
      },
      isActive: true,
      createdById: orgAdminUser.id,
    },
  });

  console.log("✅ Seeding completed successfully.");
  console.log("");
  console.log("Demo login accounts");
  console.log("-------------------");
  console.log(`Password for all users: ${DEMO_PASSWORD}`);
  console.log("");
  console.log(`Super Admin:     ${superAdmin.email}`);
  console.log(`Platform Admin:  ${platformAdmin.email}`);
  console.log(`Org Admin:       ${orgAdminUser.email}`);
  console.log(`Manager:         ${managerUser.email}`);
  console.log(`Office:          ${officeUser.email}`);
  console.log(`Accountant:      ${accountantUser.email}`);
  console.log(`Caretaker:       ${caretakerUser.email}`);
  console.log(`Tenant:          ${tenantUser.email}`);
  console.log("");
  console.log({
    organization: org.name,
    property: property.name,
    occupiedUnit: occupiedUnit.houseNo,
    vacantUnit: vacantUnit.houseNo,
    tenant: tenant.fullName,
    subscriptionPlan: subscription.plan,
    paymentsCreated: 3,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });