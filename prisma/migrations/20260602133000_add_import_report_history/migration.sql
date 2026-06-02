CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "createdRows" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "rowResults" JSONB,
    "rollbackSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReportExport" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "period" TEXT,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImportRun_orgId_createdAt_idx" ON "ImportRun"("orgId", "createdAt");
CREATE INDEX "ImportRun_actorUserId_createdAt_idx" ON "ImportRun"("actorUserId", "createdAt");
CREATE INDEX "ImportRun_kind_createdAt_idx" ON "ImportRun"("kind", "createdAt");
CREATE INDEX "ImportRun_status_createdAt_idx" ON "ImportRun"("status", "createdAt");

CREATE INDEX "ReportExport_orgId_createdAt_idx" ON "ReportExport"("orgId", "createdAt");
CREATE INDEX "ReportExport_actorUserId_createdAt_idx" ON "ReportExport"("actorUserId", "createdAt");
CREATE INDEX "ReportExport_reportType_createdAt_idx" ON "ReportExport"("reportType", "createdAt");

ALTER TABLE "ImportRun" ADD CONSTRAINT "ImportRun_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
