import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { decodePublicId } from "@/lib/public-id";
import { readAssetBytes } from "@/lib/storage/read-asset-bytes";
import { reportChecklistItems } from "@/app/(app)/dashboard/caretaker/inspections/[inspectionId]/_lib/constants";

export const dynamic = "force-dynamic";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

function printable(value: unknown) {
  return String(value ?? "—")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E]/g, "?")
    .trim() || "—";
}

function formatDate(value: Date | null | undefined) {
  if (!value || Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeZone: "Africa/Nairobi",
  }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value || Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inspectionId: string }> },
) {
  const session = await requireUserSession();
  if (!session.userId || !session.activeOrgId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { inspectionId: publicInspectionId } = await params;
  let inspectionId: string;
  try {
    inspectionId = decodePublicId(publicInspectionId, "inspection");
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      notice: {
        tenant: {
          userId: session.userId,
          orgId: session.activeOrgId,
          deletedAt: null,
        },
      },
    },
    include: {
      inspector: { select: { fullName: true } },
      notice: {
        include: {
          tenant: { select: { fullName: true } },
          lease: {
            include: {
              org: { select: { name: true } },
              unit: {
                include: {
                  property: { select: { name: true } },
                  building: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!inspection) return new NextResponse("Not found", { status: 404 });

  const report =
    inspection.checklist &&
    typeof inspection.checklist === "object" &&
    !Array.isArray(inspection.checklist)
      ? (inspection.checklist as Record<string, unknown>)
      : {};
  const roomPhotos =
    report.roomPhotos &&
    typeof report.roomPhotos === "object" &&
    !Array.isArray(report.roomPhotos)
      ? (report.roomPhotos as Record<string, string>)
      : {};
  const photoIds = Object.entries(roomPhotos)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([, assetId]) => assetId);
  const checkIn =
    report.checkIn && typeof report.checkIn === "object" && !Array.isArray(report.checkIn)
      ? (report.checkIn as Record<string, unknown>)
      : {};
  const checkInPhotoId = typeof checkIn.photoAssetId === "string" ? checkIn.photoAssetId : null;
  if (checkInPhotoId) photoIds.push(checkInPhotoId);

  const photoAssets = photoIds.length
    ? await prisma.asset.findMany({
        where: {
          id: { in: photoIds },
          orgId: session.activeOrgId,
          unitId: inspection.notice.lease.unitId,
          deletedAt: null,
        },
        select: { id: true, fileName: true, key: true, mimeType: true },
      })
    : [];
  const assetsById = new Map(photoAssets.map((asset) => [asset.id, asset]));

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Inspection report ${inspection.referenceCode}`);
  pdf.setAuthor("EstateDesk");
  pdf.setSubject("Tenant move-out inspection report");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.08, 0.11, 0.16);
  const muted = rgb(0.38, 0.42, 0.48);
  const accent = rgb(0.08, 0.38, 0.32);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 54;

  const addPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };
  const ensureSpace = (height: number) => {
    if (y - height < MARGIN) addPage();
  };
  const addHeading = (text: string) => {
    ensureSpace(38);
    y -= 5;
    page.drawText(printable(text), { x: MARGIN, y, size: 12, font: bold, color: accent });
    y -= 20;
  };
  const addLine = (text: string, size = 10, color = ink, font = regular) => {
    const safe = printable(text);
    const maxWidth = PAGE_WIDTH - MARGIN * 2;
    const words = safe.split(" ");
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
        ensureSpace(size + 7);
        page.drawText(line, { x: MARGIN, y, size, font, color });
        y -= size + 5;
        line = word;
      } else {
        line = next;
      }
    }
    if (line) {
      ensureSpace(size + 7);
      page.drawText(line, { x: MARGIN, y, size, font, color });
      y -= size + 5;
    }
  };
  const addField = (label: string, value: unknown) => {
    addLine(`${label}: ${printable(value)}`);
  };

  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 92, width: PAGE_WIDTH, height: 92, color: ink });
  page.drawText("ESTATEDESK", { x: MARGIN, y: PAGE_HEIGHT - 47, size: 10, font: bold, color: rgb(0.72, 0.82, 0.78) });
  page.drawText("MOVE-OUT INSPECTION REPORT", { x: MARGIN, y: PAGE_HEIGHT - 70, size: 16, font: bold, color: rgb(1, 1, 1) });
  y = PAGE_HEIGHT - 123;
  addLine(inspection.notice.lease.org.name, 15, ink, bold);
  addLine(`${inspection.notice.lease.unit.property.name}${inspection.notice.lease.unit.building?.name ? ` · ${inspection.notice.lease.unit.building.name}` : ""} · Unit ${inspection.notice.lease.unit.houseNo}`, 11, muted);
  y -= 8;

  addHeading("Report and tenancy details");
  addField("Inspection reference", inspection.referenceCode);
  addField("Notice reference", inspection.notice.referenceCode);
  addField("Tenant", inspection.notice.tenant.fullName);
  addField("Status", inspection.status.replaceAll("_", " "));
  addField("Notice status", inspection.notice.status.replaceAll("_", " "));
  addField("Notice date", formatDate(inspection.notice.noticeDate));
  addField("Move-out date", formatDate(inspection.notice.moveOutDate));
  addField("Scheduled at", formatDateTime(inspection.scheduledAt));
  addField("Completed at", formatDateTime(inspection.completedAt));
  addField("Inspector", inspection.inspector.fullName);
  addField("Report submitted at", formatDateTime(
    typeof report.submittedAt === "string" ? new Date(report.submittedAt) : inspection.completedAt,
  ));
  addField("On-site check-in", formatDateTime(
    typeof checkIn.capturedAt === "string" ? new Date(checkIn.capturedAt) : null,
  ));

  addHeading("Property condition checklist");
  for (const item of reportChecklistItems) {
    const value = report[item.key];
    addField(item.label, value === true ? "Yes" : value === false ? "No" : "Not recorded");
  }

  addHeading("Move-out notice notes");
  addLine(inspection.notice.notes ?? "No additional move-out notice notes were recorded.");
  addHeading("Inspection summary");
  addLine(typeof report.summary === "string" ? report.summary : inspection.notes ?? "No summary was recorded.");
  addHeading("Damage and recommended repairs");
  addLine(typeof report.recommendations === "string" && report.recommendations.trim() ? report.recommendations : "No repair recommendations were recorded.");

  const evidence = [
    ...Object.entries(roomPhotos)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([label, assetId]) => ({ label: label.replaceAll(/([A-Z])/g, " $1"), assetId })),
    ...(checkInPhotoId ? [{ label: "Site check-in", assetId: checkInPhotoId }] : []),
  ];
  if (evidence.length) {
    addHeading("Photo evidence");
    for (const item of evidence) {
      const asset = assetsById.get(item.assetId);
      if (!asset) continue;
      if (asset.mimeType !== "image/jpeg" && asset.mimeType !== "image/png") {
        addField(item.label, `${asset.fileName} (viewable in the online report)`);
        continue;
      }
      try {
        const bytes = await readAssetBytes(asset.key);
        const image = asset.mimeType === "image/png"
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(bytes);
        const scale = Math.min(480 / image.width, 260 / image.height, 1);
        const width = image.width * scale;
        const height = image.height * scale;
        ensureSpace(height + 36);
        addLine(`${item.label}: ${asset.fileName}`, 9, muted);
        page.drawImage(image, { x: MARGIN, y: y - height, width, height });
        y -= height + 16;
      } catch {
        addField(item.label, `${asset.fileName} (photo could not be embedded)`);
      }
    }
  } else {
    addHeading("Photo evidence");
    addLine("No photos were attached to this inspection.", 10, muted);
  }

  addLine(`Generated ${formatDateTime(new Date())} · EstateDesk`, 8, muted);
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inspection-${inspection.referenceCode}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
