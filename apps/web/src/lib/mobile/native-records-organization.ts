




import "server-only";




import type { AppSession } from "@/lib/auth/session";
import type { MobileWorkspaceKind, NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { nativeOrgWideAccess, nativeUnitScope } from "./native-workspace-policy";







import { nativeTenantRecordActions } from "./native-tenant-admin-actions";
import { nativeBnbRecordActions } from "./native-bnb-actions";

import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";



import { card } from "./native-records-display";
export async function nativeOrganizationRecords(session: AppSession, kind: MobileWorkspaceKind, path: string, q: string, page: number, recordId?: string): Promise<{ records: NativeWorkspaceRecord[]; notice?: string; searchable?: boolean; hasMore?: boolean } | undefined> {
  const orgId = session.activeOrgId!;
  const unit = nativeUnitScope(orgId, session.membershipScope);
  const wide = nativeOrgWideAccess(session.membershipScope);
  const limit = { skip: (page - 1) * 25, take: 26 };
  const newest = [{ createdAt: "desc" as const }, { id: "desc" as const }];
  const contains = { contains: q, mode: "insensitive" as const };
  const section = path === "/api-keys" ? "api-keys" : path.replace(kind === "platform" ? /^\/platform\/?/ : kind === "landlord" ? /^\/dashboard\/landlord\/?/ : /^\/dashboard\/org\/?/, "");
  const restricted = { records: [], notice: "This view requires organization-wide access. Your assigned property, building or unit scope remains in effect." };
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
return undefined;
}
