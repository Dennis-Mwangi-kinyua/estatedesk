import type { OrgRole } from "@prisma/client";
import { KeyRound } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";

type OrgApiKeysOnboardingProps = {
  orgRole?: OrgRole | null;
};

export function OrgApiKeysOnboarding({ orgRole }: OrgApiKeysOnboardingProps) {
  return (
    <div className="mb-5 rounded-[20px] border border-border bg-muted/30 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm">
          <KeyRound className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Integration quick start</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Create a key for external apps that need your published vacant units.
            Authenticate with a Bearer token and call the public listings endpoint.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Endpoint:</span>{" "}
          <code className="rounded-md bg-card px-1.5 py-0.5 text-xs">
            GET /api/public/vacant-houses
          </code>
        </li>
        <li>
          <span className="font-medium text-foreground">Auth:</span>{" "}
          <code className="rounded-md bg-card px-1.5 py-0.5 text-xs">
            Authorization: Bearer &lt;organization-api-key&gt;
          </code>
        </li>
        <li>
          <span className="font-medium text-foreground">Limits:</span> 60 requests
          per minute per key; up to 200 units per response.
        </li>
      </ul>

      <InAppGuideHint
        topic="apiIntegrations"
        workspace="org"
        orgRole={orgRole}
      />
    </div>
  );
}