import "server-only";
import { nativeAgreementRecordActions } from "./native-agreement-actions";
import { getProductionReadinessReport } from "@/lib/ops/production-readiness";
import { platformEndpointDocs } from "./platform-endpoint-docs";
import { getGlobalSearchResults } from "@/app/(app)/platform/search/_lib/queries";
import type { AppSession } from "@/lib/auth/session";
import type { MobileWorkspaceKind, NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { nativeOrgWideAccess, nativeUnitScope } from "./native-workspace-policy";
import { identityOwners } from "@/features/identity/service";
import { agreementData, AGREEMENT_ENTITY } from "@/lib/service-agreements/contract";
import { guideArticles } from "@/lib/guides";
import { canAccessGuideSlug } from "@/lib/help/in-app-guides";
import { getRuntimeEnvReport } from "@/lib/config/env";
import { getIntegrationReadinessReport } from "@/lib/integrations";
import { isPlatformApiKeysUnlocked } from "@/app/(app)/platform/api-keys/actions";
import { nativeTenantRecordActions } from "./native-tenant-admin-actions";
import { nativeBnbRecordActions } from "./native-bnb-actions";
import { canViewAuditLogs } from "@/lib/permissions/access";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";

type Value = string | number | boolean | Date | null | undefined | { toString(): string };
function display(value: Value): string {
  if (value === null || value === undefined || value === "") return "—";
  if (value instanceof Date) return value.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric" });
  return typeof value === "boolean" ? value ? "Yes" : "No" : String(value);
}
function card(id: string, title: string, status: string | undefined, fields: Record<string, Value>, subtitle = ""): NativeWorkspaceRecord {
  return { id, title, status, subtitle, fields: Object.entries(fields).map(([label, value]) => ({ label, value: display(value) })) };
}

export async function nativeWorkspaceRecords(session: AppSession, kind: MobileWorkspaceKind, path: string, q: string, page: number, recordId?: string): Promise<{ records: NativeWorkspaceRecord[]; notice?: string; searchable?: boolean }> {
  if (kind === "platform" && !canViewAuditLogs(session.platformRole)) return { records: [], notice: "Platform administrator access is required.", searchable: false };
  const orgId = session.activeOrgId!;
  const unit = nativeUnitScope(orgId, session.membershipScope);
  const wide = nativeOrgWideAccess(session.membershipScope);
  const limit = { skip: (page - 1) * 25, take: 26 };
  const newest = [{ createdAt: "desc" as const }, { id: "desc" as const }];
  const contains = { contains: q, mode: "insensitive" as const };
  const section = path === "/api-keys" ? "api-keys" : path.replace(kind === "platform" ? /^\/platform\/?/ : kind === "landlord" ? /^\/dashboard\/landlord\/?/ : /^\/dashboard\/org\/?/, "");
  const restricted = { records: [], notice: "This view requires organization-wide access. Your assigned property, building or unit scope remains in effect." };
  if (recordId && section !== "agreements" && section !== "airbnb/bookings" && !(kind === "landlord" && ["property", "unit"].includes(section))) return { records: [], notice: "This record destination is unavailable." };
  if (section === "help" || section === "developer/docs") {
    const workspace = kind === "platform" ? "platform" : kind === "landlord" ? "landlord" : "org";
    const articles = guideArticles.filter(article => canAccessGuideSlug(article.slug, workspace, session.activeOrgRole) && (!q || `${article.title} ${article.summary}`.toLowerCase().includes(q.toLowerCase())));
    return { records: articles.slice(limit.skip, limit.skip + limit.take).map(article => card(article.slug, article.title, undefined,
      Object.fromEntries(article.sections.map((item, index) => [`${index + 1}. ${item.heading}`, item.paragraphs.join("\n\n")])), article.summary)) };
  }
  if (kind === "landlord") {
    if (session.activeOrgRole !== "LANDLORD" || !orgId) return { records: [], notice: "Landlord workspace access is unavailable." };
    const profile = await prisma.landlordProfile.findFirst({
      where: { orgId, userId: session.userId, deletedAt: null, isActive: true },
      select: {
        id: true, displayName: true,
        assignments: {
          where: { active: true, endedAt: null },
          select: {
            property: { select: {
              id: true, name: true, location: true, address: true,
              units: { where: { deletedAt: null, isActive: true }, select: {
                id: true, houseNo: true, status: true, rentAmount: true,
                leases: { where: { deletedAt: null, status: "ACTIVE" }, take: 1, select: { startDate: true, endDate: true, monthlyRent: true, tenant: { select: { fullName: true } } } },
              } },
            } },
            unit: { select: {
              id: true, houseNo: true, status: true, rentAmount: true,
              property: { select: { id: true, name: true, location: true, address: true } },
              leases: { where: { deletedAt: null, status: "ACTIVE" }, take: 1, select: { startDate: true, endDate: true, monthlyRent: true, tenant: { select: { fullName: true } } } },
            } },
          },
        },
      },
    });
    if (!profile) return { records: [], notice: "No active landlord profile is linked to this account." };
    const properties = new Map<string, { name: string; location: string | null; address: string | null; units: Map<string, { houseNo: string; status: string; rent: number; tenant: string | null; leaseStart: Date | null; leaseEnd: Date | null; leaseRent: number | null }> }>();
    for (const assignment of profile.assignments) {
      const property = assignment.property ?? assignment.unit?.property;
      if (!property) continue;
      const entry = properties.get(property.id) ?? { name: property.name, location: property.location, address: property.address, units: new Map() };
      if (assignment.property) for (const unit of assignment.property.units) { const lease = unit.leases[0]; entry.units.set(unit.id, { houseNo: unit.houseNo, status: unit.status, rent: Number(unit.rentAmount), tenant: lease?.tenant.fullName ?? null, leaseStart: lease?.startDate ?? null, leaseEnd: lease?.endDate ?? null, leaseRent: lease ? Number(lease.monthlyRent) : null }); }
      if (assignment.unit) { const unit = assignment.unit, lease = unit.leases[0]; entry.units.set(unit.id, { houseNo: unit.houseNo, status: unit.status, rent: Number(unit.rentAmount), tenant: lease?.tenant.fullName ?? null, leaseStart: lease?.startDate ?? null, leaseEnd: lease?.endDate ?? null, leaseRent: lease ? Number(lease.monthlyRent) : null }); }
      properties.set(property.id, entry);
    }
    if (section === "property") {
      if (!recordId) return { records: [], notice: "Open one of your assigned properties to review its units." };
      const property = properties.get(recordId);
      if (!property) return { records: [], notice: "This property is not assigned to your landlord profile." };
      return { records: [...property.units].map(([id, unit]) => ({ ...card(id, unit.houseNo, unit.status, { Property: property.name, Tenant: unit.tenant, "Monthly rent": unit.rent, "Lease starts": unit.leaseStart, "Lease ends": unit.leaseEnd }, "Assigned unit"), links: [{ title: "Unit and tenancy details", path: "/dashboard/landlord/unit", recordId: id, emoji: "🚪", description: "Open your authorized unit and active tenancy details." }] })) };
    }
    if (section === "unit") {
      if (!recordId) return { records: [], notice: "Select an assigned unit to review its tenancy." };
      for (const property of properties.values()) {
        const unit = property.units.get(recordId);
        if (unit) return { records: [card(recordId, `${property.name} · ${unit.houseNo}`, unit.status, { Property: property.name, Location: property.location, Address: property.address, Tenant: unit.tenant, "Monthly rent": unit.leaseRent ?? unit.rent, "Lease starts": unit.leaseStart, "Lease ends": unit.leaseEnd }, "Assigned unit and current tenancy")] };
      }
      return { records: [], notice: "This unit is not assigned to your landlord profile." };
    }
    if (section === "statements" || section === "payouts") {
      const rows = await prisma.accountingJournalEntry.findMany({ where: { orgId, status: "POSTED", ...(section === "payouts" ? { sourceType: "OWNER_DISTRIBUTION" } : {}), lines: { some: { landlordId: profile.id } }, ...(q ? { OR: [{ entryNumber: contains }, { description: contains }, { memo: contains }] } : {}) }, ...limit, orderBy: [{ entryDate: "desc" }, { id: "desc" }], select: { id: true, entryNumber: true, entryDate: true, description: true, memo: true, sourceType: true, lines: { where: { landlordId: profile.id }, select: { debit: true, credit: true, propertyId: true } } } });
      const propertyIds = [...new Set(rows.flatMap(row => row.lines.map(line => line.propertyId).filter((id): id is string => Boolean(id))))];
      const propertyNames = propertyIds.length ? await prisma.property.findMany({ where: { orgId, id: { in: propertyIds } }, select: { id: true, name: true } }) : [];
      const names = new Map(propertyNames.map(property => [property.id, property.name]));
      return { records: rows.map(row => card(row.id, `${row.entryNumber} · ${row.memo || row.description}`, row.sourceType, { Date: row.entryDate, Properties: [...new Set(row.lines.map(line => line.propertyId ? names.get(line.propertyId) : null).filter(Boolean))].join(", "), Income: row.lines.reduce((sum, line) => sum + Number(line.credit), 0), Expenses: row.lines.reduce((sum, line) => sum + Number(line.debit), 0) })) };
    }
    const rows = [...properties].filter(([, property]) => !q || `${property.name} ${property.location ?? ""} ${property.address ?? ""}`.toLowerCase().includes(q.toLowerCase())).slice(limit.skip, limit.skip + limit.take);
    return { records: rows.map(([id, property]) => { const units = [...property.units.values()]; const occupied = units.filter(unit => unit.status === "OCCUPIED").length; return { ...card(id, property.name, undefined, { Location: property.location, Address: property.address, Units: units.length, Occupied: occupied, Vacant: units.filter(unit => unit.status === "VACANT").length, "Monthly rent roll": units.reduce((sum, unit) => sum + unit.rent, 0), Tenants: [...new Set(units.map(unit => unit.tenant).filter(Boolean))].length }, "Assigned property portfolio"), links: [{ title: "View assigned units", path: "/dashboard/landlord/property", recordId: id, emoji: "🏘️", description: "Review unit occupancy and current tenancy details." }] }; }) };
  }
  if (kind === "organization") {
    switch (section) {
      case "properties": {
        const rows = await prisma.property.findMany({ where: { orgId, deletedAt: null, ...(wide ? {} : { units: { some: unit } }), ...(q ? { name: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, name: true, type: true, location: true, address: true, isActive: true } });
        return { records: rows.map(row => card(row.id, row.name, row.isActive ? "ACTIVE" : "INACTIVE", { Type: row.type, Location: row.location, Address: row.address })) };
      }
      case "buildings": {
        const rows = await prisma.building.findMany({ where: { deletedAt: null, property: { orgId, deletedAt: null }, ...(wide ? {} : { units: { some: unit } }), ...(q ? { name: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, name: true, isActive: true, notes: true, property: { select: { name: true } } } });
        return { records: rows.map(row => ({ ...card(row.id, row.name, row.isActive ? "ACTIVE" : "INACTIVE", { Property: row.property.name, Notes: row.notes }),
          ...(wide && ["ADMIN", "MANAGER"].includes(session.activeOrgRole ?? "") ? { actions: [{ id: "inventory.building.delete", title: "Delete building", destructive: true }] } : {}),
        })) };
      }
      case "tenants": {
        const rows = await prisma.tenant.findMany({ where: { orgId, deletedAt: null, ...(wide ? {} : { leases: { some: { deletedAt: null, unit } } }), ...(q ? { fullName: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, fullName: true, phone: true, email: true, status: true, type: true, archivedAt: true, blacklistedAt: true, leases: { where: { status: "ACTIVE", deletedAt: null }, select: { id: true }, take: 1 } } });
        return { records: rows.map(row => ({ ...card(row.id, row.fullName, row.status, { Phone: row.phone, Email: row.email, Type: row.type }), actions: nativeTenantRecordActions(session, path, { archivedAt: row.archivedAt, blacklistedAt: row.blacklistedAt, hasActiveLease: row.leases.length > 0 }) })) };
      }
      case "leases": {
        const rows = await prisma.lease.findMany({ where: { orgId, deletedAt: null, tenant: { deletedAt: null }, unit, ...(q ? { tenant: { deletedAt: null, fullName: contains } } : {}) }, ...limit, orderBy: newest,
          select: { id: true, status: true, startDate: true, endDate: true, monthlyRent: true, deposit: true, dueDay: true, tenant: { select: { fullName: true } }, unit: { select: { houseNo: true, property: { select: { name: true } } } } } });
        return { records: rows.map(row => card(row.id, row.tenant.fullName, row.status, { Property: row.unit.property.name, Unit: row.unit.houseNo, "Monthly rent": row.monthlyRent, Deposit: row.deposit, "Due day": row.dueDay, Start: row.startDate, End: row.endDate })) };
      }
      case "issues": {
        const rows = await prisma.issueTicket.findMany({ where: { orgId, ...(wide ? {} : { unit }), ...(q ? { title: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, title: true, status: true, priority: true, description: true, createdAt: true, assignedTo: { select: { fullName: true } } } });
        return { records: rows.map(row => card(row.id, row.title, row.status, { Priority: row.priority, Description: row.description, Assigned: row.assignedTo?.fullName, Reported: row.createdAt })) };
      }
      case "issues/resolution-reports": {
        const rows = await prisma.issueResolutionReport.findMany({ where: { orgId, issue: { ...(wide ? {} : { unit }), ...(q ? { title: contains } : {}) } }, ...limit,
          orderBy: [{ submittedAt: "desc" }, { id: "desc" }], select: { id: true, status: true, workSummary: true, materialsUsed: true, tenantInstructions: true, officeNotes: true, tenantFeedback: true, submittedAt: true,
            caretaker: { select: { fullName: true } }, issue: { select: { title: true, unit: { select: { houseNo: true, property: { select: { name: true } } } } } } } });
        return { records: rows.map(row => card(row.id, row.issue.title, row.status, { Property: row.issue.unit?.property.name, Unit: row.issue.unit?.houseNo, Caretaker: row.caretaker.fullName, "Work completed": row.workSummary, Materials: row.materialsUsed, "Tenant instructions": row.tenantInstructions, "Office notes": row.officeNotes, "Tenant feedback": row.tenantFeedback, Submitted: row.submittedAt })) };
      }
      case "move-outs": {
        const rows = await prisma.moveOutNotice.findMany({ where: { lease: { orgId, deletedAt: null, unit }, ...(q ? { referenceCode: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, referenceCode: true, status: true, noticeDate: true, moveOutDate: true, notes: true, tenant: { select: { fullName: true } } } });
        return { records: rows.map(row => card(row.id, row.referenceCode, row.status, { Tenant: row.tenant.fullName, "Notice date": row.noticeDate, "Move-out date": row.moveOutDate, Notes: row.notes })) };
      }
      case "inspections": {
        const rows = await prisma.inspection.findMany({ where: { notice: { lease: { orgId, deletedAt: null, unit } }, ...(q ? { referenceCode: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, referenceCode: true, status: true, scheduledAt: true, completedAt: true, notes: true, inspector: { select: { fullName: true } } } });
        return { records: rows.map(row => card(row.id, row.referenceCode, row.status, { Inspector: row.inspector.fullName, Scheduled: row.scheduledAt, Completed: row.completedAt, Notes: row.notes })) };
      }
      case "water-bills": {
        const rows = await prisma.waterBill.findMany({ where: { orgId, unit, ...(q ? { period: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, period: true, status: true, total: true, amountPaid: true, balance: true, unitsUsed: true, dueDate: true, tenant: { select: { fullName: true } }, unit: { select: { houseNo: true } } } });
        return { records: rows.map(row => card(row.id, `${row.unit.houseNo} · ${row.period}`, row.status, { Tenant: row.tenant.fullName, Usage: row.unitsUsed, Total: row.total, Paid: row.amountPaid, Balance: row.balance, Due: row.dueDate })) };
      }
      case "charges": {
        const rows = await prisma.rentCharge.findMany({ where: { orgId, lease: { deletedAt: null, unit }, ...(q ? { period: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, period: true, status: true, chargeType: true, amountDue: true, amountPaid: true, balance: true, dueDate: true } });
        return { records: rows.map(row => card(row.id, `${row.chargeType} · ${row.period}`, row.status, { Billed: row.amountDue, Paid: row.amountPaid, Balance: row.balance, Due: row.dueDate })) };
      }
      case "vacancy-inquiries": {
        const rows = await prisma.vacancyInquiry.findMany({ where: { orgId, unit, ...(q ? { fullName: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, fullName: true, status: true, phone: true, email: true, message: true, createdAt: true } });
        return { records: rows.map(row => ({ ...card(row.id, row.fullName, row.status, { Phone: row.phone, Email: row.email, Message: row.message, Received: row.createdAt }), actions: ["ADMIN", "MANAGER", "OFFICE"].includes(session.activeOrgRole ?? "") ? [{ id: "vacancy-inquiry.status", title: "Update status" }] : [] })) };
      }
      case "profile": {
        const row = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, fullName: true, email: true, phone: true, username: true, status: true } });
        return { records: row ? [card(row.id, row.fullName, row.status, { Username: row.username, Email: row.email, Phone: row.phone, Role: session.activeOrgRole })] : [], searchable: false };
      }
      case "accounting": case "accounting/coa": {
        if (!wide) return restricted;
        const rows = await prisma.accountingAccount.findMany({ where: { orgId, ...(q ? { OR: [{ name: contains }, { code: contains }] } : {}) }, ...limit, orderBy: { code: "asc" }, select: { id: true, code: true, name: true, type: true, normalBalance: true, isActive: true } });
        return { records: rows.map(row => ({ ...card(row.id, `${row.code} · ${row.name}`, row.isActive ? "ACTIVE" : "INACTIVE", { Type: row.type, "Normal balance": row.normalBalance }),
          ...(path === "/dashboard/org/accounting/coa" && ["ADMIN", "MANAGER", "ACCOUNTANT"].includes(session.activeOrgRole ?? "") ? { actions: [{ id: "accounting.account.update", title: "Edit account" }] } : {}),
        })) };
      }
      case "accounting/journals": {
        if (!wide) return restricted;
        const rows = await prisma.accountingJournalEntry.findMany({
          where: { orgId, ...(q ? { OR: [{ entryNumber: contains }, { description: contains }] } : {}) },
          ...limit,
          orderBy: [{ entryDate: "desc" }, { id: "desc" }],
          select: { id: true, entryNumber: true, entryDate: true, description: true, memo: true, status: true, sourceType: true, lines: { select: { debit: true, credit: true } } },
        });
        return { records: rows.map(row => card(row.id, `${row.entryNumber} · ${row.description}`, row.status, {
          Date: row.entryDate, Source: row.sourceType,
          Debits: row.lines.reduce((sum, line) => sum + Number(line.debit), 0),
          Credits: row.lines.reduce((sum, line) => sum + Number(line.credit), 0), Lines: row.lines.length, Memo: row.memo,
        })) };
      }
      case "finance-requests": case "accounting/requests": {
        if (!wide) return restricted;
        const rows = await prisma.accountingRequest.findMany({ where: { orgId, ...(section === "finance-requests" ? { submittedByUserId: session.userId } : {}), ...(q ? { title: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, title: true, requestNumber: true, status: true, type: true, description: true, amount: true, currencyCode: true, reviewerFeedback: true } });
        return { records: rows.map(row => card(row.id, row.title, row.status, { Reference: row.requestNumber, Type: row.type, Description: row.description, Amount: `${row.currencyCode} ${row.amount}`, Feedback: row.reviewerFeedback })) };
      }
      case "expenditures": {
        if (!wide) return restricted;
        const rows = await prisma.expenditure.findMany({ where: { orgId, scope: "ORGANIZATION", ...(q ? { description: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, description: true, status: true, category: true, amount: true, currencyCode: true, incurredAt: true, payee: true } });
        return { records: rows.map(row => card(row.id, row.description, row.status, { Amount: `${row.currencyCode} ${row.amount}`, Category: row.category, Payee: row.payee, Date: row.incurredAt })) };
      }
      case "taxes": {
        if (!wide) return restricted;
        const rows = await prisma.taxCharge.findMany({ where: { orgId, ...(q ? { period: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, taxType: true, period: true, status: true, amountDue: true, amountPaid: true, balance: true, dueDate: true } });
        return { records: rows.map(row => card(row.id, `${row.taxType} · ${row.period}`, row.status, { Billed: row.amountDue, Paid: row.amountPaid, Balance: row.balance, Due: row.dueDate })) };
      }
      case "staff": case "staff/permissions": {
        if (!wide) return restricted;
        const rows = await prisma.membership.findMany({ where: { orgId, employmentEndedAt: null, role: { not: "TENANT" }, ...(q ? { user: { fullName: contains } } : {}) }, ...limit, orderBy: newest,
          select: { id: true, role: true, scopeType: true, deactivatedAt: true, user: { select: { fullName: true, email: true } } } });
        return { records: rows.map(row => ({ ...card(row.id, row.user.fullName, row.deactivatedAt ? "INACTIVE" : "ACTIVE", { Role: row.role, Scope: row.scopeType, Email: row.user.email }),
          ...(path === "/dashboard/org/staff" && !row.deactivatedAt && memberHasOrgPermission(session, "org.users.manage") && row.role !== "ADMIN" ? { actions: [{ id: "staff.update", title: "Edit staff profile" }, ...(memberHasOrgPermission(session, "org.users.delete") ? [{ id: "staff.deactivate", title: "Deactivate staff", destructive: true }] : [])] } : {}),
          ...(path === "/dashboard/org/staff/permissions" && session.activeOrgRole === "ADMIN" && !row.deactivatedAt && ["MANAGER", "OFFICE", "ACCOUNTANT"].includes(row.role) ? { actions: [{ id: "staff.permissions.update", title: "Manage permissions" }] } : {}),
        })) };
      }
      case "community": {
        if (!wide) return restricted;
        const rows = await prisma.communityNotice.findMany({ where: { orgId, ...(q ? { title: contains } : {}) }, ...limit, orderBy: [{ publishedAt: "desc" }, { id: "desc" }], select: { id: true, title: true, message: true, publishedAt: true, archivedAt: true } });
        return { records: rows.map(row => card(row.id, row.title, row.archivedAt ? "ARCHIVED" : "PUBLISHED", { Message: row.message, Published: row.publishedAt })) };
      }
      case "reports": {
        if (!wide) return restricted;
        const rows = await prisma.reportExport.findMany({ where: { orgId, actorUserId: session.userId, ...(q ? { fileName: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, fileName: true, reportType: true, period: true, status: true, createdAt: true } });
        return { records: rows.map(row => card(row.id, row.fileName, row.status, { Type: row.reportType, Period: row.period, Created: row.createdAt })) };
      }
      case "imports": {
        if (!wide) return restricted;
        const rows = await prisma.importRun.findMany({ where: { orgId, actorUserId: session.userId, ...(q ? { kind: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, kind: true, status: true, mode: true, totalRows: true, createdRows: true, errorCount: true, createdAt: true } });
        return { records: rows.map(row => card(row.id, row.kind, row.status, { Mode: row.mode, Rows: row.totalRows, Created: row.createdRows, Errors: row.errorCount, Date: row.createdAt })) };
      }
      case "airbnb": {
        if (!wide) return restricted;
        const rows = await prisma.bnbListing.findMany({ where: { orgId, deletedAt: null, ...(q ? { title: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, title: true, location: true, status: true, nightlyRate: true, bedrooms: true, maxGuests: true } });
        return { records: rows.map(row => ({ ...card(row.id, row.title, row.status, { Location: row.location, "Nightly rate": row.nightlyRate, Bedrooms: row.bedrooms, Guests: row.maxGuests }), links: [{ title: "Bookings & guest access", path: "/dashboard/org/airbnb/bookings", recordId: row.id, emoji: "🛎️", description: "Manage reservations, check-in, guest access and requests." }], actions: nativeBnbRecordActions(session, path, row.status) })) };
      }
      case "airbnb/bookings": {
        if (!wide || !recordId) return { records: [], notice: "Open a listing first to manage its bookings." };
        const listing = await prisma.bnbListing.findFirst({ where: { id: recordId, orgId, deletedAt: null }, select: { id: true, title: true, status: true, minimumNights: true, availableFrom: true, propertyId: true } });
        if (!listing) return { records: [], notice: "This listing is unavailable in your organization." };
        const linkedProperty = listing.propertyId ? await prisma.property.findFirst({ where: { id: listing.propertyId, orgId, deletedAt: null }, select: { name: true } }) : null;
        const stays = await prisma.bnbReservation.findMany({ where: { listingId: listing.id, checkOut: { gte: new Date(Date.now() - 30 * 86400000) }, ...(q ? { guestName: contains } : {}) }, ...limit, orderBy: [{ checkIn: "desc" }, { id: "desc" }], select: { id: true, guestName: true, guestPhone: true, checkIn: true, checkOut: true, checkedInAt: true, checkedOutAt: true, cancelledAt: true, guestTokenHash: true, requests: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, message: true, resolvedAt: true, createdAt: true } } } });
        const now = new Date();
        const listingCard = { ...card(listing.id, listing.title, listing.status, { Property: linkedProperty?.name, "Minimum nights": listing.minimumNights, "Available from": listing.availableFrom }, "Listing booking workspace"), actions: [{ id: "bnb.booking.create", title: "New booking" }, { id: "bnb.settings", title: "Availability settings" }] };
        const stayCards = stays.map(stay => {
          const status = stay.cancelledAt ? "CANCELLED" : stay.checkedOutAt ? "CHECKED OUT" : stay.checkedInAt ? "OCCUPIED" : stay.checkOut <= now ? "ENDED" : "BOOKED";
          const actions = stay.cancelledAt || stay.checkedOutAt ? [] : [
            ...(!stay.checkedInAt ? [{ id: "bnb.booking.update", title: "Edit booking" }, { id: "bnb.stay.check-in", title: "Check in guest" }, { id: "bnb.stay.cancel", title: "Cancel booking", destructive: true }] : [{ id: "bnb.stay.check-out", title: "Check out guest" }]),
            ...(stay.checkOut > now ? [stay.guestTokenHash ? { id: "bnb.stay.revoke-access", title: "Revoke guest access", destructive: true } : { id: "bnb.stay.issue-access", title: "Issue guest access" }] : []),
          ];
          return { ...card(stay.id, stay.guestName, status, { Phone: stay.guestPhone, "Check-in": stay.checkIn, "Check-out": stay.checkOut, "Guest login": stay.guestTokenHash ? "Issued" : "Not issued" }), actions };
        });
        const requestCards = stays.flatMap(stay => stay.requests.map(request => ({ ...card(request.id, "Guest request", request.resolvedAt ? "RESOLVED" : "OPEN", { Guest: stay.guestName, Message: request.message, Received: request.createdAt }), ...(!request.resolvedAt ? { actions: [{ id: "bnb.request.resolve", title: "Mark resolved" }] } : {}) })));
        return { records: [listingCard, ...stayCards, ...requestCards], searchable: true };
      }
      case "units": {
        const rows = await prisma.unit.findMany({ where: { ...unit, ...(q ? { OR: [{ houseNo: contains }, { property: { name: contains } }] } : {}) }, ...limit, orderBy: newest, select: { id: true, houseNo: true, status: true, type: true, rentAmount: true, property: { select: { name: true } } } });
        return { records: rows.map(row => ({ ...card(row.id, `${row.property.name} · ${row.houseNo}`, row.status, { Type: row.type, Rent: row.rentAmount }),
          ...(wide && ["ADMIN", "MANAGER"].includes(session.activeOrgRole ?? "") ? { actions: [{ id: "unit.edit", title: "Edit unit" }, { id: "inventory.unit.delete", title: "Delete unit", destructive: true }] } : {}),
        })) };
      }
      case "settings": {
        if (!wide) return restricted;
        const row = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true, status: true, currencyCode: true, timezone: true, phone: true, email: true, address: true } });
        return { records: row ? [card(row.id, row.name, row.status, { Currency: row.currencyCode, Timezone: row.timezone, Phone: row.phone, Email: row.email, Address: row.address })] : [], searchable: false };
      }
      case "payments": {
        if (!wide) return restricted;
        const rows = await prisma.payment.findMany({ where: { orgId, ...(q ? { reference: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, amount: true, reference: true, method: true, gatewayStatus: true, verificationStatus: true, createdAt: true, org: { select: { currencyCode: true } } } });
        return { records: rows.map(row => card(row.id, row.reference ?? "Awaiting reference", row.verificationStatus, { Amount: `${row.org.currencyCode} ${row.amount}`, Method: row.method, Gateway: row.gatewayStatus, Created: row.createdAt })) };
      }
      case "service-providers": {
        if (!wide) return restricted;
        const rows = await prisma.serviceJob.findMany({ where: { orgId, ...(q ? { title: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, title: true, description: true, status: true, category: true, location: true, completionNotes: true, provider: { select: { businessName: true } } } });
        return { records: rows.map(row => card(row.id, row.title, row.status, { Category: row.category, Location: row.location, Description: row.description, Provider: row.provider?.businessName, "Completion notes": row.completionNotes })) };
      }
      case "insights": case "search": {
        const rows = await prisma.unit.findMany({ where: { ...unit, ...(q ? { OR: [{ houseNo: contains }, { property: { name: contains } }] } : {}) }, ...limit, orderBy: newest, select: { id: true, houseNo: true, status: true, type: true, rentAmount: true, property: { select: { name: true } } } });
        return { records: rows.map(row => card(row.id, `${row.property.name} · ${row.houseNo}`, row.status, { Type: row.type, Rent: row.rentAmount })), notice: section === "insights" ? "Unit occupancy and rental amounts in your assigned scope. Predictive insights are not available in this native view." : "Search currently covers units and property names." };
      }
      case "support": {
        const rows = await prisma.platformMessage.findMany({ where: { orgId, senderUserId: session.userId, ...(q ? { subject: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, subject: true, message: true, status: true, createdAt: true } });
        return { records: rows.map(row => card(row.id, row.subject, row.status, { Message: row.message, Sent: row.createdAt })) };
      }
    }
  }
  if (section === "agreements") {
    if (kind === "organization" && !wide) return restricted;
    const rows = await prisma.documentRecord.findMany({ where: { entityType: AGREEMENT_ENTITY, ...(recordId ? { id: recordId } : {}), ...(kind === "organization" ? { orgId, status: { in: ["ISSUED", "COMPLETED"] } } : {}), ...(q ? { title: contains } : {}) }, ...limit, orderBy: newest,
      select: { id: true, title: true, status: true, serialNumber: true, createdAt: true, issuedAt: true, revokedAt: true, revocationReason: true, contentHash: true, metadata: true, org: { select: { name: true } } } });
    return { records: rows.map(row => { const data = agreementData(row.metadata); const record = card(row.id, row.title, row.status, { Organization: row.org.name, Number: row.serialNumber,
      "Agreement text": data.body, "Organization signature": data.organizationSignature ? `${data.organizationSignature.name} · ${data.organizationSignature.signedAt}` : "Not signed",
      "EstateDesk signature": data.platformSignature ? `${data.platformSignature.name} · ${data.platformSignature.signedAt}` : "Not signed",
      "Template version": data.templateVersion, "Content hash": row.contentHash, Created: row.createdAt, Issued: row.issuedAt, Cancelled: row.revokedAt, "Cancellation reason": row.revocationReason });
      const platform = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole);
      record.actions = nativeAgreementRecordActions(kind, path, row.status).filter(action => {
        if (action.id === "agreement.sign") return platform ? kind === "platform" && !!data.organizationSignature && !data.platformSignature : !data.organizationSignature;
        if (action.id === "agreement.remind") return (platform || !!data.organizationSignature) && !(data.lastReminder?.party === (data.organizationSignature ? "ESTATEDESK" : "ORGANIZATION") && new Date(data.lastReminder.sentAt).getTime() > Date.now() - 86400000);
        return true;
      });
      return record; }) };
  }
  if (section === "identity-verification" || section === "verify-tenant") {
    if (kind === "organization" && !wide) return restricted;
    const rows = await prisma.identityVerificationRequest.findMany({ where: { ...(kind === "organization" ? { orgId } : {}), ...(q ? { OR: [{ fullName: contains }, { org: { name: contains } }] } : {}) }, ...limit, orderBy: newest,
      select: { id: true, number: true, fullName: true, phone: true, email: true, requestedRole: true, status: true, reason: true, createdAt: true, reviewedAt: true, reviewNotes: true, org: { select: { name: true } } } });
    // Ownership evidence is visible to platform reviewers only. Organization users
    // see the masked ID and their own organization's review results.
    const ownership = new Map<string, Record<string, Value>>();
    if (kind === "platform") {
      await Promise.all(rows.slice(0, 25).map(async row => {
        const owners = await identityOwners(row.number);
        const accounts = await prisma.user.findMany({ where: { id: { in: owners.flatMap(owner => owner.userId ? [owner.userId] : []) } }, take: 25,
          select: { fullName: true, email: true, phone: true, status: true, deletedAt: true } });
        ownership.set(row.id, { "Ownership check": owners.length === 1 && owners[0]?.userId ? "One linked identity owner. Authenticate the person's ID and consent before approval." : "Conflicting or unlinked legacy identity records. Resolve ownership before approval.",
          ...Object.fromEntries(accounts.map((account, index) => [`Registered account ${index + 1}`, [account.fullName, account.email, account.phone, account.status, account.deletedAt ? "Removed" : null].filter(Boolean).join(" · ")])) });
      }));
    }
    return { records: rows.map(row => card(row.id, row.fullName, row.status, { Organization: row.org.name, Role: row.requestedRole,
      "National ID": kind === "platform" ? row.number : `Ending ${row.number.slice(-4)}`, Phone: row.phone, Email: row.email, Reason: row.reason,
      ...ownership.get(row.id), "Platform review": row.reviewNotes, Requested: row.createdAt, Reviewed: row.reviewedAt })) };
  }
  if (section === "api-keys") {
    if (kind === "platform" && !await isPlatformApiKeysUnlocked(session.userId)) return { records: [], notice: "API key management is locked. Use Unlock API key vault to enter the management password.", searchable: false };
    if (kind === "organization" && !wide) return restricted;
    const rows = await prisma.apiKey.findMany({ where: { ...(kind === "organization" ? { orgId } : {}), ...(q ? { name: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, name: true, isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true } });
    return { records: rows.map(row => card(row.id, row.name, row.isActive ? "ACTIVE" : "INACTIVE", { "Last used": row.lastUsedAt, Expires: row.expiresAt, Created: row.createdAt })) };
  }
  if (kind === "platform") {
    switch (section) {
      case "organizations": case "support-access": {
        const rows = await prisma.organization.findMany({ where: { deletedAt: null, ...(q ? { name: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, name: true, slug: true, status: true, email: true, phone: true, address: true, currencyCode: true, timezone: true, createdAt: true,
          subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
          documentRecords: { where: { entityType: AGREEMENT_ENTITY, status: { in: ["DRAFT", "ISSUED", "COMPLETED"] } }, orderBy: newest, take: 1, select: { id: true } },
          _count: { select: { properties: { where: { deletedAt: null } }, tenants: { where: { deletedAt: null } }, memberships: { where: { deactivatedAt: null } } } } } });
        return { records: rows.map(row => { const record = card(row.id, row.name, row.status, { Email: row.email, Phone: row.phone, Address: row.address, Slug: row.slug,
          Currency: row.currencyCode, Timezone: row.timezone, Properties: row._count.properties, Tenants: row._count.tenants, "Active memberships": row._count.memberships,
          Plan: row.subscription?.plan, "Subscription status": row.subscription?.status, Renewal: row.subscription?.currentPeriodEnd, Registered: row.createdAt });
          record.links = [{ title: "DPA agreement", path: "/platform/agreements", ...(row.documentRecords?.[0] ? { recordId: row.documentRecords[0].id } : {}), emoji: "🤝", description: "Review service terms, signatures and agreement actions." }];
          return record; }) };
      }
      case "feature-flags": {
        const rows = await prisma.organization.findMany({ where: { deletedAt: null, ...(q ? { name: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, name: true, settings: { select: { features: true } } } });
        return { records: rows.map(row => card(row.id, row.name, undefined, { "Configured features": JSON.stringify(row.settings?.features ?? {}, null, 2) })) };
      }
      case "permissions": {
        const rows = await prisma.platformPermission.findMany({ where: q ? { user: { fullName: contains } } : {}, ...limit, orderBy: newest, select: { id: true, permission: true, granted: true, user: { select: { fullName: true } } } });
        return { records: rows.map(row => card(row.id, row.user.fullName, row.granted ? "GRANTED" : "DENIED", { Permission: row.permission })) };
      }
      case "service-providers/reports": {
        const rows = await prisma.providerReport.findMany({ where: { resolvedAt: null, ...(q ? { OR: [{ reason: contains }, { provider: { businessName: contains } }] } : {}) }, ...limit, orderBy: newest,
          select: { id: true, reason: true, createdAt: true, provider: { select: { businessName: true, status: true } }, org: { select: { name: true } }, job: { select: { title: true } } } });
        return { records: rows.map(row => card(`report:${row.id}`, row.provider.businessName, "REPORT_PENDING", { Organization: row.org.name, Job: row.job.title, Reason: row.reason, "Provider status": row.provider.status, Reported: row.createdAt })) };
      }
      case "service-providers": {
        const rows = await prisma.serviceProvider.findMany({ where: q ? { businessName: contains } : {}, ...limit, orderBy: newest, select: { id: true, businessName: true, category: true, location: true, status: true, available: true, lastSeenAt: true } });
        return { records: rows.map(row => card(row.id, row.businessName, row.status, { Category: row.category, Location: row.location, Available: row.available, "Last seen": row.lastSeenAt })) };
      }
      case "settings": {
        const checks = getRuntimeEnvReport().checks.filter(check => !q || check.label.toLowerCase().includes(q.toLowerCase()));
        return { records: checks.slice(limit.skip, limit.skip + limit.take).map(check => card(check.key, check.label, check.status.toUpperCase(), { Group: check.group, Importance: check.importance })) };
      }
      case "api-explorer": {
        const providers = getIntegrationReadinessReport().integrations.map(provider => card(`integration:${provider.id}`, provider.name, provider.status, { Category: provider.category, Region: provider.region, "Next step": provider.nextAction }));
        const endpoints = platformEndpointDocs.map(endpoint => card(`endpoint:${endpoint.path}`, `${endpoint.method} ${endpoint.path}`, undefined, { Group: endpoint.group, Authentication: endpoint.auth, Purpose: endpoint.purpose }));
        const records = [...endpoints, ...providers].filter(record => !q || JSON.stringify(record).toLowerCase().includes(q.toLowerCase()));
        return { records: records.slice(limit.skip, limit.skip + limit.take) };
      }
      case "rate-limits": {
        const rows = await prisma.rateLimitBucket.findMany({ where: { resetAt: { gt: new Date() } }, ...limit, orderBy: { resetAt: "desc" }, select: { key: true, count: true, resetAt: true } });
        return { records: rows.map(row => card(row.key, row.key, "ACTIVE", { Requests: row.count, Reset: row.resetAt })), searchable: false };
      }
      case "search": {
        const result = await getGlobalSearchResults(q);
        if (!result.hasQuery) return { records: [], notice: "Enter at least two characters to search organizations, accounts, tenants, units and payment references." };
        const records = [
          ...result.orgs.map(row => card(`org:${row.id}`, row.name, row.status, { Type: "Organization", Slug: row.slug, Updated: row.updatedAt })),
          ...result.users.map(row => card(`user:${row.id}`, row.fullName, undefined, { Type: "Account", Email: row.email, Phone: row.phone, Username: row.username, Role: row.platformRole, Updated: row.updatedAt })),
          ...result.tenants.map(row => card(`tenant:${row.id}`, row.fullName, row.status, { Type: "Tenant", Organization: row.org.name, Phone: row.phone, Updated: row.updatedAt })),
          ...result.payments.map(row => card(`payment:${row.id}`, row.reference ?? row.externalReference ?? "Payment", row.gatewayStatus, { Type: "Payment", Organization: row.org.name, Amount: row.amount, Target: row.targetType, "External reference": row.externalReference, Checkout: row.checkoutRequestId, Created: row.createdAt })),
          ...result.units.map(row => card(`unit:${row.id}`, `${row.property.name} · ${row.houseNo}`, row.status, { Type: "Unit", Organization: row.property.org.name, Updated: row.updatedAt })),
        ];
        return { records: records.slice(limit.skip, limit.skip + limit.take), notice: "Up to 10 matches per resource type. Refine your search for more specific results." };
      }
      case "reports": {
        const [organizations, subscriptions, issues, queued, payments] = await Promise.all([
          prisma.organization.count({ where: { deletedAt: null } }), prisma.subscription.count({ where: { status: "ACTIVE" } }),
          prisma.issueTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }), prisma.notification.count({ where: { status: "QUEUED" } }),
          prisma.payment.findMany({ take: 500, orderBy: newest, select: { amount: true, org: { select: { currencyCode: true } } } }),
        ]);
        const volume = new Map<string, number>();
        for (const payment of payments) volume.set(payment.org.currencyCode, (volume.get(payment.org.currencyCode) ?? 0) + Number(payment.amount));
        const records = [card("organizations", "Organizations", undefined, { Count: organizations }), card("subscriptions", "Active subscriptions", undefined, { Count: subscriptions }),
          card("issues", "Open maintenance", undefined, { Count: issues }), card("notifications", "Queued notifications", undefined, { Count: queued }),
          card("payment-volume", "Recent payment volume", undefined, { "Payments sampled": payments.length, ...Object.fromEntries([...volume].map(([currency, amount]) => [currency, amount.toFixed(2)])) }, "Latest 500 payment records, separated by currency.")];
        return { records: records.slice(limit.skip, limit.skip + limit.take), searchable: false };
      }
      case "users": case "admins": {
        const rows = await prisma.user.findMany({ where: { deletedAt: null, ...(section === "admins" ? { platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] as ("SUPER_ADMIN" | "PLATFORM_ADMIN")[] } } : {}), ...(q ? { fullName: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, fullName: true, username: true, email: true, phone: true, status: true, platformRole: true, lastLoginAt: true, twoFactorEnabled: true, createdAt: true,
            emailVerified: true, phoneVerified: true, mustChangePassword: true,
            memberships: { where: { deactivatedAt: null, org: { deletedAt: null } }, take: 10, orderBy: { createdAt: "desc" }, select: { role: true, scopeType: true, org: { select: { name: true } } } },
            _count: { select: { memberships: { where: { deactivatedAt: null, org: { deletedAt: null } } } } } } });
        return { records: rows.map(row => card(row.id, row.fullName, row.status, { Email: row.email, Phone: row.phone, Username: row.username, Role: row.platformRole,
          "Two-factor enabled": row.twoFactorEnabled, "Email verified": !!row.emailVerified, "Phone verified": !!row.phoneVerified, "Password change required": row.mustChangePassword,
          "Active memberships": row._count.memberships, ...Object.fromEntries(row.memberships.map((membership, index) => [`Workspace ${index + 1}`, `${membership.org.name} · ${membership.role} · ${membership.scopeType}`])),
          "Last login": row.lastLoginAt, Registered: row.createdAt })) };
      }
      case "subscriptions": case "billing": {
        const rows = await prisma.subscription.findMany({ where: q ? { org: { name: contains } } : {}, ...limit, orderBy: newest, select: { id: true, plan: true, status: true, currentPeriodStart: true, currentPeriodEnd: true, billingEmail: true, trialStartsAt: true, trialEndsAt: true, cancelAt: true, cancelledAt: true, org: { select: { name: true, currencyCode: true } } } });
        return { records: rows.map(row => card(row.id, row.org.name, row.status, { Plan: row.plan, "Billing email": row.billingEmail, Currency: row.org.currencyCode,
          Start: row.currentPeriodStart, Renewal: row.currentPeriodEnd, "Trial start": row.trialStartsAt, "Trial end": row.trialEndsAt, "Cancellation scheduled": row.cancelAt, Cancelled: row.cancelledAt })) };
      }
      case "audit-logs": case "security": {
        const rows = await prisma.auditLog.findMany({ where: { ...(q ? { action: contains } : {}), ...(section === "security" ? { OR: ["LOGIN", "LOGOUT", "DENIED", "PASSWORD", "SESSION", "PERMISSION"].map(value => ({ action: { contains: value, mode: "insensitive" as const } })) } : {}) }, ...limit, orderBy: newest,
          select: { id: true, action: true, entityType: true, createdAt: true, actor: { select: { fullName: true } }, org: { select: { name: true } } } });
        return { records: rows.map(row => card(row.id, row.action, undefined, { Actor: row.actor.fullName, Entity: row.entityType, Organization: row.org?.name, Date: row.createdAt })) };
      }
      case "system-health": {
        const report = await getProductionReadinessReport();
        const records = report.checks.filter(check => !q || `${check.label} ${check.detail}`.toLowerCase().includes(q.toLowerCase())).map(check => card(check.id, check.label, check.status.toUpperCase(), { Detail: check.detail, Blocking: check.blocking }));
        return { records: records.slice(limit.skip, limit.skip + limit.take) };
      }
      case "jobs/notifications": {
        const rows = await prisma.notification.findMany({ where: { status: { in: ["QUEUED", "FAILED"] }, ...(q ? { title: contains } : {}) }, ...limit, orderBy: newest,
          select: { id: true, title: true, status: true, channel: true, message: true, createdAt: true, org: { select: { name: true } } } });
        return { records: rows.map(row => card(row.id, row.title, row.status, { Organization: row.org.name, Channel: row.channel, Message: row.message, Created: row.createdAt })) };
      }
      case "jobs": {
        const rows = await prisma.cronJobRun.findMany({ where: q ? { jobName: contains } : {}, ...limit, orderBy: [{ startedAt: "desc" }, { id: "desc" }], select: { id: true, jobName: true, status: true, startedAt: true, finishedAt: true, processedCount: true, successCount: true, failedCount: true } });
        return { records: rows.map(row => card(row.id, row.jobName, row.status, { Started: row.startedAt, Finished: row.finishedAt, Processed: row.processedCount, Successful: row.successCount, Failed: row.failedCount })) };
      }
      case "messages": {
        const rows = await prisma.platformMessage.findMany({ where: q ? { subject: contains } : {}, ...limit, orderBy: newest, select: { id: true, subject: true, message: true, status: true, createdAt: true, org: { select: { name: true } } } });
        return { records: rows.map(row => card(row.id, row.subject, row.status, { Organization: row.org.name, Message: row.message, Sent: row.createdAt })) };
      }
      case "onboarding": {
        const rows = await prisma.onboardingRequest.findMany({ where: q ? { companyName: contains } : {}, ...limit, orderBy: newest, select: { id: true, companyName: true, fullName: true, workEmail: true, status: true, createdAt: true } });
        return { records: rows.map(row => card(row.id, row.companyName, row.status, { Contact: row.fullName, Email: row.workEmail, Received: row.createdAt })) };
      }
      case "marketing": {
        const rows = await prisma.platformMarketer.findMany({ where: { deletedAt: null, ...(q ? { fullName: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, fullName: true, status: true, referralCode: true, email: true } });
        return { records: rows.map(row => card(row.id, row.fullName, row.status, { Email: row.email, "Referral code": row.referralCode })) };
      }
      case "expenditures": {
        const rows = await prisma.expenditure.findMany({ where: { scope: "PLATFORM", ...(q ? { description: contains } : {}) }, ...limit, orderBy: newest, select: { id: true, description: true, status: true, amount: true, currencyCode: true, category: true, incurredAt: true } });
        return { records: rows.map(row => card(row.id, row.description, row.status, { Amount: `${row.currencyCode} ${row.amount}`, Category: row.category, Date: row.incurredAt })) };
      }
      case "payments": case "payment-ops": {
        const rows = await prisma.payment.findMany({ where: q ? { reference: contains } : {}, ...limit, orderBy: newest, select: { id: true, amount: true, reference: true, method: true, gatewayStatus: true, verificationStatus: true, reconciliationStatus: true, createdAt: true, org: { select: { name: true, currencyCode: true } } } });
        return { records: rows.map(row => card(row.id, row.reference ?? "Awaiting reference", row.verificationStatus, { Organization: row.org.name, Amount: `${row.org.currencyCode} ${row.amount}`, Method: row.method, Gateway: row.gatewayStatus, Reconciliation: row.reconciliationStatus, Created: row.createdAt })) };
      }
      case "data-management": {
        const rows = await prisma.dataExportRequest.findMany({ where: q ? { org: { name: contains } } : {}, ...limit, orderBy: newest, select: { id: true, status: true, reason: true, requestedAt: true, reviewedAt: true, expiresAt: true, org: { select: { name: true } } } });
        return { records: rows.map(row => card(row.id, row.org.name, row.status, { Reason: row.reason, Requested: row.requestedAt, Reviewed: row.reviewedAt, Expires: row.expiresAt })) };
      }
      case "broadcasts": {
        const rows = await prisma.notification.findMany({ where: { type: "GENERAL", ...(q ? { OR: [{ title: contains }, { org: { name: contains } }] } : {}) }, ...limit, orderBy: newest,
          select: { id: true, title: true, message: true, channel: true, status: true, createdAt: true, org: { select: { name: true } }, user: { select: { fullName: true } }, tenant: { select: { fullName: true } } } });
        return { records: rows.map(row => card(row.id, row.title, row.status, { Organization: row.org.name, Recipient: row.user?.fullName ?? row.tenant?.fullName ?? "Organization", Channel: row.channel, Message: row.message, Created: row.createdAt })) };
      }
      case "backups": case "control": {
        const row = await prisma.platformControl.findUnique({ where: { id: "global" }, select: { lastBackupAt: true, lastBackupStatus: true, lastBackupNote: true, maintenanceMode: true, incidentMode: true, publicSignupDisabled: true, cronDisabled: true } });
        return { records: row ? [card("global", section === "backups" ? "Backup checkpoint" : "Platform controls", row.lastBackupStatus ?? undefined, section === "backups" ? { "Last backup": row.lastBackupAt, Note: row.lastBackupNote } : { Maintenance: row.maintenanceMode, Incident: row.incidentMode, "Signup disabled": row.publicSignupDisabled, "Scheduled jobs disabled": row.cronDisabled })] : [], searchable: false };
      }
    }
  }
  return { records: [], notice: "This tool's native controls are still being built. Related tools below are available in the app.", searchable: false };
}
