import { reportFiltersSchema, nativeWorkspacePageSchema, nativeWorkspaceQuerySchema } from "@estatedesk/contracts/mobile";
import { platformReport, ReportAccessError } from "@/lib/reports/platform";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";
import { mobileWorkspaceAllowed, mobileWorkspaceLinks } from "@/lib/mobile/workspace-menu";
import { nativeWorkspaceEntry } from "@/lib/mobile/native-workspace-policy";
import { nativeWorkspaceRecords } from "@/lib/mobile/native-workspace-records";
import { nativePageActions, nativeRecordActions } from "@/lib/mobile/native-actions";
import { isPlatformApiKeysUnlocked } from "@/app/(app)/platform/api-keys/actions";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { kind, path, q, page, recordId, organization, reportPeriod } = nativeWorkspaceQuerySchema.parse(params);
    if (!mobileWorkspaceAllowed(session, kind)) return mobileJson({ error: "This workspace is unavailable for your account." }, 403);
    const links = mobileWorkspaceLinks(session, kind);
    const entry = nativeWorkspaceEntry(links, path);
    if (!entry) return mobileJson({ error: "You do not have access to this tool." }, 403);
    let data;
    try { data = await (kind === "platform" && path === "/platform/reports" && reportPeriod
      ? platformReport(session, reportFiltersSchema.parse(params))
      : nativeWorkspaceRecords(session, kind, path, q, page, recordId, organization));
    } catch (error) { if (error instanceof ReportAccessError) return mobileJson({ error: error.message }, 403); throw error; }
    const vaultOpen = kind === "platform" && path === "/platform/api-keys" ? await isPlatformApiKeysUnlocked(session.userId) : false;
    return mobileJson(nativeWorkspacePageSchema.parse({ ...entry, ...data, page,
      actions: nativePageActions(session, kind, path).filter(action => path !== "/platform/api-keys" || (vaultOpen ? action.id !== "vault.unlock" : action.id === "vault.unlock")),
      hasMore: data.records.length > 25, records: data.records.slice(0, 25).map(record => ({ ...record, links: record.links?.filter(link => nativeWorkspaceEntry(links, link.path)), actions: record.organizationGroup ? [] : record.actions ?? nativeRecordActions(kind, path, record.status) })),
      related: links.filter(link => link.path !== path && !["/platform", "/platform/developer", "/dashboard/org"].includes(link.path) && link.group === entry.group).slice(0, 8),
    }));
  });
}
