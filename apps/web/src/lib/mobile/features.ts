import type { MobileFeature } from "@estatedesk/contracts/mobile";
import { rolePolicyBlocksPath, type OrgRolePolicy } from "@/lib/permissions/org-role-policy";

export function mobileFeatures(session: { activeOrgId: string | null; activeOrgRole: string | null; orgRolePolicy?: OrgRolePolicy }): MobileFeature[] {
  if (!session.activeOrgId) return [];
  const candidates: { feature: MobileFeature; roles: string[]; path: string }[] = [
    { feature: "leases", roles: ["TENANT"], path: "/api/mobile/tenant/leases" },
    { feature: "move-outs", roles: ["TENANT"], path: "/api/mobile/tenant/move-outs" },
    { feature: "caretaker-issues", roles: ["CARETAKER"], path: "/api/mobile/caretaker/issues" },
    { feature: "portfolio", roles: ["ADMIN", "MANAGER", "OFFICE"], path: "/api/mobile/org/units" },
  ];
  return candidates.filter(item => item.roles.includes(session.activeOrgRole ?? "") && !rolePolicyBlocksPath(session.orgRolePolicy, item.path)).map(item => item.feature);
}
