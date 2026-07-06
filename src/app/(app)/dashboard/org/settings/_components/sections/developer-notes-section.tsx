import { Building2, KeyRound, Users, Wallet } from "lucide-react";
import { SectionCard } from "../../settings-ui";

export function DeveloperNotesSection() {
  return (
    <SectionCard
      id="developer-notes"
      hidden
      title="Developer Notes"
      description="This version reads and writes real data."
    >
      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
          <Building2 className="mt-0.5 h-4 w-4 text-slate-500" />
          <p>Organization profile saves to the organization table.</p>
        </div>

        <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
          <Wallet className="mt-0.5 h-4 w-4 text-slate-500" />
          <p>Billing updates save to the subscription record.</p>
        </div>

        <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
          <Users className="mt-0.5 h-4 w-4 text-slate-500" />
          <p>Invitations create real invitation rows in the database.</p>
        </div>

        <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
          <KeyRound className="mt-0.5 h-4 w-4 text-slate-500" />
          <p>
            API keys are created hashed in the database and can be revoked
            or reactivated.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}