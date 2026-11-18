import { card, type Value } from "./native-records-display";
import { nativeLandlordRecords } from "./native-records-landlord";
import { nativeOrganizationRecords } from "./native-records-organization";
import { nativePlatformRecords } from "./native-records-platform";
import { nativeRentStatement, RENT_STATEMENT_PATH } from "./native-rent-statement";
import { nativePrivacyRecords } from "./native-privacy";
import { nativeLandlordRecordActions } from "./native-landlord-actions";
import { nativeCollectionRecords, COLLECTION_PATH } from "./native-collections";
import { nativeCrmRecords, crmPaths } from "./native-crm";
import "server-only";
import { nativeAgreementRecordActions } from "./native-agreement-actions";



import type { AppSession } from "@/lib/auth/session";
import type { MobileWorkspaceKind, NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { nativeOrgWideAccess } from "./native-workspace-policy";
import { identityOwners } from "@/features/identity/service";
import { agreementData, AGREEMENT_ENTITY } from "@/lib/service-agreements/contract";
import { guideArticles } from "@/lib/guides";
import { canAccessGuideSlug } from "@/lib/help/in-app-guides";


import { isPlatformApiKeysUnlocked } from "@/app/(app)/platform/api-keys/actions";


import { canViewAuditLogs } from "@/lib/permissions/access";


import { getReviewQueue, waitingAge } from "@/lib/workflow/review-queue";
import { getOperatingQueue } from "@/lib/workflow/operating-queue";

export async function nativeWorkspaceRecords(session: AppSession, kind: MobileWorkspaceKind, path: string, q: string, page: number, recordId?: string, organization?: string): Promise<{ records: NativeWorkspaceRecord[]; notice?: string; searchable?: boolean; hasMore?: boolean }> {
  if (kind === "platform" && !canViewAuditLogs(session.platformRole)) return { records: [], notice: "Platform administrator access is required.", searchable: false };
  if (kind === "platform" && path === "/platform/landlords/properties") {
    if (!organization) return {records:[],notice:"Choose an organization first."};
    const rows=await prisma.property.findMany({where:{orgId:organization,deletedAt:null,isActive:true,...(q?{name:{contains:q,mode:"insensitive"}}:{})},skip:(page-1)*25,take:26,orderBy:[{name:"asc"},{id:"asc"}],select:{id:true,name:true,location:true}});
    return {records:rows.map(row=>card(row.id,row.name,undefined,{Location:row.location}))};
  }
  if (path === "/platform/privacy-requests") return nativePrivacyRecords(session, kind, path, q, page);
  if (kind === "organization" && path === RENT_STATEMENT_PATH) return nativeRentStatement(session, recordId, page);
  if (kind === "organization" && path === COLLECTION_PATH) return nativeCollectionRecords(session, q, page);
  if (crmPaths(kind).includes(path)) return nativeCrmRecords(session, kind, path, q, page, recordId);
  const orgId = session.activeOrgId!;
  const wide = nativeOrgWideAccess(session.membershipScope);
  const limit = { skip: (page - 1) * 25, take: 26 };
  const newest = [{ createdAt: "desc" as const }, { id: "desc" as const }];
  const contains = { contains: q, mode: "insensitive" as const };
  const section = path === "/api-keys" ? "api-keys" : path.replace(kind === "platform" ? /^\/platform\/?/ : kind === "landlord" ? /^\/dashboard\/landlord\/?/ : /^\/dashboard\/org\/?/, "");
  const restricted = { records: [], notice: "This view requires organization-wide access. Your assigned property, building or unit scope remains in effect." };
  if (kind === "organization" && section === "operating-queue") {
    if (!wide) return restricted;
    const currency = prisma.organization.findUnique({ where: { id: orgId }, select: { currencyCode: true } })
      .then(org => org?.currencyCode ?? "KES");
    const groups = await getOperatingQueue(orgId, currency);
    return { searchable: false, records: groups.map(group => ({ ...card(group.id, group.title, group.total ? "PENDING" : "CLEAR", {
      Waiting: group.total, Responsible: group.owner, "Next action": group.nextAction,
      "Oldest waiting": group.items[0] ? waitingAge(group.items[0].since) : "Nothing waiting",
      ...Object.fromEntries(group.items.map((item, index) => [`${index + 1}. ${item.who}`, `${item.where}${item.amount ? ` · ${item.amount}` : ""} · ${waitingAge(item.since)} · ${item.action}`])),
    }), links: [{ title: "Open queue", path: group.href, emoji: "📋", description: group.nextAction }] })), notice: "Each row opens the same bill, payment, lease, issue, or move-out used on the website." };
  }
  if (kind === "platform" && section === "review-queue") {
    const groups = await getReviewQueue(session, "platform");
    return { searchable: false, records: groups.map(group => ({ ...card(group.id, group.title, group.total ? "PENDING" : "CLEAR", {
      Waiting: group.total, Responsible: group.owner, "Next action": group.nextAction,
      "Oldest waiting": group.items[0] ? waitingAge(group.items[0].since) : "Nothing waiting",
      ...Object.fromEntries(group.items.map((item, index) => [`${index + 1}. ${item.title}`, `${item.detail} · ${waitingAge(item.since)} · ${item.status}`])),
    }), links: [{ title: "Open queue", path: group.nativePath, emoji: "📋", description: group.nextAction }] })), notice: "Counts cover the whole queue. Each detail shows the oldest 25 items and the responsible team." };
  }
  if (recordId && !(kind === "platform" && ["users", "admins"].includes(section)) && section !== "agreements" && section !== "airbnb/bookings" && !(kind === "landlord" && ["property", "unit"].includes(section))) return { records: [], notice: "This record destination is unavailable." };
  if (section === "landlords" && (kind === "platform" || kind === "organization")) {
    if (kind === "organization" && (!wide || !["ADMIN", "MANAGER"].includes(session.activeOrgRole ?? ""))) return restricted;
    const rows = await prisma.landlordProfile.findMany({
      where: { ...(kind === "organization" ? { orgId } : {}), deletedAt: null, ...(q ? { OR: [{ displayName: contains }, { user: { username: contains } }, { org: { name: contains } }] } : {}) },
      ...limit, orderBy: newest,
      select: { id: true, displayName: true, email: true, phone: true, isActive: true, user: { select: { username: true, status: true } }, org: { select: { name: true } }, _count: { select: { assignments: { where: { active: true, endedAt: null } } } } },
    });
    return { records: rows.map(row => ({ ...card(row.id, row.displayName, row.isActive ? row.user.status : "INACTIVE", { Organization: row.org.name, Username: row.user.username, Email: row.email, Phone: row.phone, Assignments: row._count.assignments }), actions: nativeLandlordRecordActions(session, kind, row.isActive && row.user.status === "ACTIVE") })), notice: "Create accounts, assign properties, and manage landlord access from the app." };
  }
  if (section === "help" || section === "developer/docs") {
    const workspace = kind === "platform" ? "platform" : kind === "landlord" ? "landlord" : "org";
    const articles = guideArticles.filter(article => canAccessGuideSlug(article.slug, workspace, session.activeOrgRole) && (!q || `${article.title} ${article.summary}`.toLowerCase().includes(q.toLowerCase())));
    return { records: articles.slice(limit.skip, limit.skip + limit.take).map(article => card(article.slug, article.title, undefined,
      Object.fromEntries(article.sections.map((item, index) => [`${index + 1}. ${item.heading}`, item.paragraphs.join("\n\n")])), article.summary)) };
  }
  if (kind === "landlord") {
    const records = await nativeLandlordRecords(session, kind, path, q, page, recordId);
    return records ?? { records: [], searchable: false };
  }
  if (kind === "organization") {
    const records = await nativeOrganizationRecords(session, kind, path, q, page, recordId);
    if (records) return records;
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
    const records = await nativePlatformRecords(session, kind, path, q, page, recordId, organization);
    if (records) return records;
  }
  return { records: [], notice: "This tool's native controls are still being built. Related tools below are available in the app.", searchable: false };
}
