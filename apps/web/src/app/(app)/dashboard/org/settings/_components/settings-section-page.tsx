import type { ReactNode } from "react";
import type { OrgRole } from "@prisma/client";
import type { requireUserSession } from "@/lib/auth/session";
import type { SettingsPageData } from "../settings-data";
import { SETTINGS_NAV_ITEMS, type SettingsSectionId } from "../settings-ui-nav";
import { SettingsGuidance } from "./settings-guidance";
import { SettingsHeader } from "./settings-header";
import { SettingsStats } from "./settings-stats";
import { ApiKeysSection } from "./sections/api-keys-section";
import { BillingSection } from "./sections/billing-section";
import { ContactRegionSection } from "./sections/contact-region-section";
import { DangerZoneSection } from "./sections/danger-zone-section";
import { DataExportSection } from "./sections/data-export-section";
import { DeveloperNotesSection } from "./sections/developer-notes-section";
import { OrganizationProfileSection } from "./sections/organization-profile-section";
import { OrganizationSummarySection } from "./sections/organization-summary-section";
import { PaymentInstructionsSection } from "./sections/payment-instructions-section";
import { SecurityAccessSection } from "./sections/security-access-section";
import { UsersAccessSection } from "./sections/users-access-section";
import { WorkspacePreferencesSection } from "./sections/workspace-preferences-section";

type Session = Awaited<ReturnType<typeof requireUserSession>>;

function SectionSlot({
  sectionId,
  activeSectionId,
  children,
}: {
  sectionId: SettingsSectionId;
  activeSectionId: SettingsSectionId;
  children: ReactNode;
}) {
  if (sectionId !== activeSectionId) {
    return null;
  }

  return <>{children}</>;
}

export function SettingsSectionView({
  sectionId,
  data,
  session,
  activeMembers,
  activeApiKeys,
  orgRole,
}: {
  sectionId: SettingsSectionId;
  data: SettingsPageData;
  session: Session;
  activeMembers: number;
  activeApiKeys: number;
  orgRole?: OrgRole | null;
}) {
  const currentSection = SETTINGS_NAV_ITEMS.find((item) => item.id === sectionId);

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <SettingsHeader
        title={currentSection?.label ?? "Settings"}
        description={currentSection?.description}
        backHref="/dashboard/org/settings"
        backLabel="Settings home"
        showWorkflow={false}
        orgRole={orgRole}
      />

      <SettingsStats
        data={data}
        activeMembers={activeMembers}
        activeApiKeys={activeApiKeys}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <SectionSlot sectionId="organization-profile" activeSectionId={sectionId}>
            <OrganizationProfileSection data={data} />
          </SectionSlot>
          <SectionSlot sectionId="workspace-preferences" activeSectionId={sectionId}>
            <WorkspacePreferencesSection data={data} />
          </SectionSlot>
          <SectionSlot sectionId="payment-instructions" activeSectionId={sectionId}>
            <PaymentInstructionsSection data={data} />
          </SectionSlot>
          <SectionSlot sectionId="users-access" activeSectionId={sectionId}>
            <UsersAccessSection data={data} activeMembers={activeMembers} />
          </SectionSlot>
          <SectionSlot sectionId="api-keys" activeSectionId={sectionId}>
            <ApiKeysSection data={data} session={session} />
          </SectionSlot>
          <SectionSlot sectionId="organization-summary" activeSectionId={sectionId}>
            <OrganizationSummarySection data={data} />
          </SectionSlot>
          <SectionSlot sectionId="billing" activeSectionId={sectionId}>
            <BillingSection data={data} />
          </SectionSlot>
          <SectionSlot sectionId="contact-region" activeSectionId={sectionId}>
            <ContactRegionSection data={data} />
          </SectionSlot>
          <SectionSlot sectionId="security-access" activeSectionId={sectionId}>
            <SecurityAccessSection
              data={data}
              activeMembers={activeMembers}
              activeApiKeys={activeApiKeys}
            />
          </SectionSlot>
          <SectionSlot sectionId="data-export" activeSectionId={sectionId}>
            <DataExportSection data={data} />
          </SectionSlot>
          <SectionSlot sectionId="danger-zone" activeSectionId={sectionId}>
            <DangerZoneSection />
          </SectionSlot>
          <SectionSlot sectionId="developer-notes" activeSectionId={sectionId}>
            <DeveloperNotesSection />
          </SectionSlot>
        </div>

        <SettingsGuidance orgRole={orgRole} activeSectionId={sectionId} />
      </div>
    </div>
  );
}