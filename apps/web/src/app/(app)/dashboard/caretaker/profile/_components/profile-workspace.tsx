import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerProfilePageData } from "../_lib/types";
import { ProfileAccountSection } from "./profile-account-section";
import { ProfileAlertsSection } from "./profile-alerts-section";
import { ProfileDetailsSection } from "./profile-details-section";
import { ProfileHeader } from "./profile-header";
import { ProfileSidebar } from "./profile-sidebar";
import { ProfileStats } from "./profile-stats";

export function ProfileWorkspace({ data }: { data: CaretakerProfilePageData }) {
  const member = data.ok ? data.member : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {member ? <ProfileHeader member={member} /> : null}

      {!data.ok ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-5 sm:p-6">
            <ErrorStateCard message={data.errorMessage} />
          </div>
        </section>
      ) : member ? (
        <>
          <ProfileStats member={member} />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ProfileDetailsSection member={member} />

            <div className="space-y-4">
              <ProfileAccountSection member={member} />
              <ProfileSidebar />
            </div>
          </div>

          <ProfileAlertsSection />
        </>
      ) : null}

      <CaretakerWorkspaceFooter note="Employment profile and account settings for caretakers" />
    </div>
  );
}