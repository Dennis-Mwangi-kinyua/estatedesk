import type { OrgRole } from "@prisma/client";
import type { SupportPageData } from "../_lib/types";
import { SupportForm } from "./support-form";
import { SupportGuidance } from "./support-guidance";
import { SupportHeader } from "./support-header";
import { SupportMessagesSection } from "./support-messages-section";

export function SupportWorkspace({
  data,
  orgRole,
}: {
  data: SupportPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <SupportHeader data={data} orgRole={orgRole} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <SupportForm />
          <SupportMessagesSection data={data} />
        </div>
        <SupportGuidance />
      </div>
    </div>
  );
}