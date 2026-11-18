import { mobileImportKindSchema, mobileImportRequestSchema, mobileImportResultSchema } from "@estatedesk/contracts/mobile";
import { nativeRoute } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { readBoundedJson } from "@/lib/security/bounded-json";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { IMPORT_TEMPLATES } from "@/lib/imports/templates";
import { runCsvImportAction } from "@/app/(app)/dashboard/org/imports/actions";
import { initialImportState } from "@/app/(app)/dashboard/org/imports/import-state";
import { guardedSubmission, submissionIdentity } from "@/lib/workflow/submissions";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";
import type { MobileImportKind } from "@estatedesk/contracts/mobile";

function allowed(session: AppSession, kind: MobileImportKind) {
  return session.membershipScope?.scopeType === "ORG" && canAccessWorkspacePath(session, "/dashboard/org/imports") &&
    canAccessWorkspacePath(session, `/dashboard/org/${kind}`) && memberHasOrgPermission(session, kind === "tenants" ? "tenants.manage" : "properties.manage");
}
export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const kind = mobileImportKindSchema.parse(new URL(request.url).searchParams.get("kind"));
    if (!allowed(session, kind)) return mobileJson({ error: "Import access denied." }, 403);
    return mobileJson({ template: IMPORT_TEMPLATES[kind] });
  });
}
export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!request.headers.get("content-type")?.startsWith("application/json")) return mobileJson({ error: "JSON required." }, 400);
    const input = mobileImportRequestSchema.parse(await readBoundedJson(request, 640_000));
    if (!allowed(session, input.kind)) return mobileJson({ error: "Import access denied." }, 403);
    const execute = async () => {
      const form = new FormData();
      for (const key of ["kind", "csv", "mode", "validationToken", "confirmImport"] as const) {
        if (input[key] !== undefined) form.set(key, input[key]);
      }
      const result = await runCsvImportAction(initialImportState, form);
      return mobileJson(mobileImportResultSchema.parse(result));
    };
    return guardedSubmission(prisma, submissionIdentity(session.userId, `${session.activeOrgId}:native-import:${input.kind}`, input.submissionId, input), execute);
  });
}
