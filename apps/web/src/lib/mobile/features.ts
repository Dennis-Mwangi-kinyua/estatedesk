import type { OrgRole } from "@prisma/client";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import type { MobileFeature } from "@estatedesk/contracts/mobile";
import { rolePolicyBlocksPath, type OrgRolePolicy } from "@/lib/permissions/org-role-policy";

export function mobileFeatures(session: { activeOrgId: string | null; activeOrgRole: string | null; orgRolePolicy?: OrgRolePolicy; grantedPermissions?: string[] }): MobileFeature[] {
  if (!session.activeOrgId) return [];
  const candidates: { feature: MobileFeature; roles: string[]; path: string }[] = [
    { feature: "leases", roles: ["TENANT"], path: "/api/mobile/tenant/leases" },
    { feature: "move-outs", roles: ["TENANT"], path: "/api/mobile/tenant/move-outs" },
    { feature: "caretaker-issues", roles: ["CARETAKER"], path: "/api/mobile/caretaker/issues" },
    { feature: "portfolio", roles: ["ADMIN", "MANAGER", "OFFICE"], path: "/api/mobile/org/units" },
    { feature: "documents", roles: ["TENANT"], path: "/api/mobile/tenant/documents" },
    { feature: "inspections", roles: ["CARETAKER"], path: "/api/mobile/caretaker/inspections" },
    { feature: "visitors", roles: ["TENANT"], path: "/api/mobile/tenant/visitors" },
    { feature: "gate", roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER", "SECURITY"], path: "/api/mobile/gate/visitors" },
  ];
  if (memberHasOrgPermission({ ...session, activeOrgRole: session.activeOrgRole as OrgRole | null }, "payments.verify")) candidates.push({ feature: "payment-review", roles: [session.activeOrgRole!], path: "/api/mobile/org/payments" });
  return candidates.filter(item => item.roles.includes(session.activeOrgRole ?? "") && !rolePolicyBlocksPath(session.orgRolePolicy, item.path)).map(item => item.feature);
}

/** Older installed apps validate a closed feature enum; advertise only what they understand. */
export function advertisedMobileFeatures(features: MobileFeature[], revision: string | null) {
  if (revision === "2026-10-18") return features;
  return features.filter(feature => ["leases", "move-outs", "caretaker-issues", "portfolio"].includes(feature));
}
