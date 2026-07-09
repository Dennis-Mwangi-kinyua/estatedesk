-- Singleton platform-wide kill switches and developer control-plane state.
CREATE TABLE "PlatformControl" (
    "id" TEXT NOT NULL,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "publicSignupDisabled" BOOLEAN NOT NULL DEFAULT false,
    "publicApiDisabled" BOOLEAN NOT NULL DEFAULT false,
    "webhooksDisabled" BOOLEAN NOT NULL DEFAULT false,
    "cronDisabled" BOOLEAN NOT NULL DEFAULT false,
    "tenantPortalsDisabled" BOOLEAN NOT NULL DEFAULT false,
    "orgDashboardsDisabled" BOOLEAN NOT NULL DEFAULT false,
    "globalFeatures" JSONB,
    "notes" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformControl_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformControl" ("id", "updatedAt")
VALUES ('global', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
