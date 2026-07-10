import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { generateOwnerStatementPdf } from "@/lib/documents/owner-statement-pdf";
import { getOwnerStatement } from "@/lib/accounting/owner-statements";
import { previousCalendarMonthRange, shouldSendOwnerStatementsToday } from "@/lib/accounting/owner-statement-policy";
import { getAccountingSettings } from "@/lib/accounting/settings";
import { sendOwnerStatementEmail } from "@/lib/notifications/owner-statement-email";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

export async function buildOwnerStatementPdfForLandlord(
  db: AccountingDb,
  orgId: string,
  landlordId: string,
  from: Date,
  to: Date,
) {
  const [org, statement] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { name: true, address: true, currencyCode: true },
    }),
    getOwnerStatement(db, orgId, landlordId, from, to),
  ]);

  const pdfBytes = await generateOwnerStatementPdf({
    organizationName: org.name,
    organizationAddress: org.address,
    landlordName: statement.landlord.displayName,
    landlordEmail: statement.landlord.email,
    from: statement.from,
    to: statement.to,
    currencyCode: org.currencyCode,
    generatedAt: new Date(),
    properties: statement.properties,
    totals: statement.totals,
  });

  return { org, statement, pdfBytes };
}

export async function sendOwnerStatementToLandlord(input: {
  db: AccountingDb;
  orgId: string;
  landlordId: string;
  from: Date;
  to: Date;
  actorUserId?: string | null;
}) {
  const { org, statement, pdfBytes } = await buildOwnerStatementPdfForLandlord(
    input.db,
    input.orgId,
    input.landlordId,
    input.from,
    input.to,
  );

  const email = statement.landlord.email?.trim();
  if (!email) {
    throw new Error(`${statement.landlord.displayName} has no email address on file.`);
  }

  const periodLabel = `${input.from.toISOString().slice(0, 10)} to ${input.to.toISOString().slice(0, 10)}`;

  await sendOwnerStatementEmail({
    to: email,
    landlordName: statement.landlord.displayName,
    orgName: org.name,
    periodLabel,
    netToOwner: formatMoney(statement.totals.netToOwner, org.currencyCode),
    pdfBytes,
    filename: `owner-statement-${statement.landlord.displayName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.pdf`,
  });

  if (input.actorUserId) {
    await input.db.auditLog.create({
      data: {
        orgId: input.orgId,
        actorUserId: input.actorUserId,
        action: "OWNER_STATEMENT_EMAILED",
        entityType: "LandlordProfile",
        entityId: input.landlordId,
        metadata: {
          email,
          periodLabel,
          netToOwner: statement.totals.netToOwner,
        },
      },
    });
  }

  return { email, landlordName: statement.landlord.displayName, periodLabel };
}

export async function runScheduledOwnerStatementDelivery(db: PrismaClient, asOf = new Date()) {
  const orgs = await db.accountingSettings.findMany({
    where: { ownerStatementEmailEnabled: true, initializedAt: { not: null } },
    select: {
      orgId: true,
      ownerStatementEmailEnabled: true,
      ownerStatementEmailDayOfMonth: true,
      ownerStatementLastSentAt: true,
    },
  });

  let orgsProcessed = 0;
  let emailsSent = 0;
  let skipped = 0;
  let failed = 0;

  const { startsAt, endsAt, label } = previousCalendarMonthRange(asOf);

  for (const settings of orgs) {
    if (!shouldSendOwnerStatementsToday(settings, asOf)) {
      skipped += 1;
      continue;
    }

    const landlords = await db.landlordProfile.findMany({
      where: { orgId: settings.orgId, isActive: true, deletedAt: null, email: { not: null } },
      select: { id: true, displayName: true, email: true },
    });

    let orgFailed = 0;

    for (const landlord of landlords) {
      try {
        await sendOwnerStatementToLandlord({
          db,
          orgId: settings.orgId,
          landlordId: landlord.id,
          from: startsAt,
          to: endsAt,
        });
        emailsSent += 1;
      } catch (error) {
        orgFailed += 1;
        failed += 1;
        console.error("Owner statement email failed", {
          orgId: settings.orgId,
          landlordId: landlord.id,
          error,
        });
      }
    }

    await db.accountingSettings.update({
      where: { orgId: settings.orgId },
      data: { ownerStatementLastSentAt: asOf },
    });

    orgsProcessed += 1;

    if (orgFailed === 0 && landlords.length > 0) {
      console.log("Owner statements sent", {
        orgId: settings.orgId,
        period: label,
        count: landlords.length,
      });
    }
  }

  return { orgsProcessed, emailsSent, skipped, failed, periodLabel: label };
}