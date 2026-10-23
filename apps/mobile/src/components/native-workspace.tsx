import { NativePlatformReports } from "./native-platform-reports";
import { FeatureCard } from "./feature-card";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Text, TextInput, View } from "react-native";
import type { MobileWorkspaceKind, NativeWorkspacePage, NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { AppIcon, IconTile } from "./app-icon";
import { useCardGrid, cardGridStyles as gridStyles } from "./card-grid";
import { DashboardSection, dashboardStyles } from "./dashboard-ui";
import { Button, styles } from "./ui";
import { NativeActionForm } from "./native-action-form";
import { NativeReportCards } from "./native-report-cards";
import { NativeRecordList } from "./native-record-list";
import { WorkspaceRecordPage } from "./workspace-record-page";

export type WorkspaceTarget = { recordId?: string; kind: MobileWorkspaceKind; path: string; title: string; emoji: string; description: string };

/** Native record browser. Never renders HTML, remote scripts, or a WebView. */
function NativeRecordWorkspace({ target, open, onBack, onError, reviewPayments, help = false, onMutationBusy = () => {}, onContextChange }: { target: WorkspaceTarget; open: (target: WorkspaceTarget) => void; onBack: () => void; onError: (error: unknown) => void; reviewPayments?: () => void; help?: boolean; onMutationBusy?: (busy: boolean) => void; onContextChange?: () => Promise<void> }) {
  const [action, setAction] = useState<{ actionId: string; recordId?: string } | null>(null);
  const [data, setData] = useState<NativeWorkspacePage | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [organization, setOrganization] = useState<{ id: string; name: string } | null>(null);
  const [userDetail, setUserDetail] = useState<NativeWorkspaceRecord | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailRequest = useRef(0);
  const userDirectory = target.kind === "platform" && target.path === "/platform/users";
  const platformReports = target.kind === "platform" && target.path === "/platform/reports";
  const jobQueue = target.kind === "platform" && ["/platform/jobs", "/platform/jobs/notifications"].includes(target.path);
  const organizationId = userDirectory ? organization?.id : undefined;
  const previousQuery = useRef("");
  const grid = useCardGrid();
  const detail = userDetail?.id === expanded ? userDetail : data?.records.find(record => record.id === expanded);
  const closeDetail = () => { detailRequest.current++; setExpanded(null); setUserDetail(null); setDetailError(""); setDetailBusy(false); };
  const openUser = async (id: string) => {
    const request = ++detailRequest.current;
    setExpanded(id); setUserDetail(null); setDetailBusy(true); setDetailError("");
    try {
      const result = await api.getNativeWorkspace(target.kind, target.path, "", 1, id, organizationId);
      if (request !== detailRequest.current) return;
      const record = result.records.find(item => item.id === id);
      if (!record) throw new Error("This user is no longer available in this organization.");
      setUserDetail(record);
    } catch (cause) {
      if (request !== detailRequest.current) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      else setDetailError(cause instanceof Error ? cause.message : "Unable to load user details.");
    } finally { if (request === detailRequest.current) setDetailBusy(false); }
  };
  useEffect(() => {
    let active = true;
    const queryKey = JSON.stringify([target.kind, target.path, target.recordId, search, page, help, organizationId]);
    const changedQuery = previousQuery.current !== queryKey;
    previousQuery.current = queryKey;
    // Keep the current records and detail visible during a refresh. A different
    // search or page must never display records belonging to the previous query.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusy(true); setError("");
    if (changedQuery) { setData(null); setExpanded(null); setUserDetail(null); setDetailError(""); setDetailBusy(false); }
    void (help ? api.getHelp(search, page) : api.getNativeWorkspace(target.kind, target.path, search, page, target.recordId, organizationId)).then(result => {
      if (active) { setData(result); if (target.recordId && result.records.some(record => record.id === target.recordId)) setExpanded(target.recordId); }
    }).catch(cause => {
      if (!active) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      else setError(cause instanceof Error ? cause.message : "Unable to load records.");
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; detailRequest.current++; };
  }, [target.kind, target.path, target.recordId, search, page, revision, onError, help, organizationId]);
  const applySearch = () => { if (!busy) { Keyboard.dismiss(); setPage(1); setSearch(query.trim()); setRevision(value => value + 1); } };
  const actionForm = action ? <NativeActionForm request={{ kind: target.kind, path: target.path, ...action }} onError={onError} onBusyChange={onMutationBusy} close={(completed, contextChanged) => { setAction(null); if (contextChanged && onContextChange) void onContextChange().catch(onError); else if (completed) setRevision(value => value + 1); }} /> : null;
  return <View style={{ gap: 22 }} onLayout={grid.onLayout}>
    {detail ? <WorkspaceRecordPage record={detail} workspace={userDirectory && organization ? `${organization.name} users` : target.title} emoji={target.emoji} close={() => target.recordId ? onBack() : closeDetail()} open={link => { closeDetail(); open({ ...link, kind: target.kind }); }} act={(actionId, recordId) => setAction({ actionId, recordId })}>
      {detailBusy ? <View style={styles.card}><ActivityIndicator accessibilityLabel="Loading user identity details" /><Text style={styles.subtitle}>Loading identity details…</Text></View> : null}
      {detailError ? <View style={styles.card}><Text accessibilityRole="alert" style={styles.subtitle}>{detailError}</Text><Button label="Retry user details" onPress={() => { if (expanded) void openUser(expanded); }} /></View> : null}
      {actionForm}
    </WorkspaceRecordPage> : actionForm}
    <View style={dashboardStyles.hero}>
      <Text style={dashboardStyles.eyebrow}>{target.kind === "platform" ? "PLATFORM WORKSPACE" : target.kind === "landlord" ? "LANDLORD WORKSPACE" : "ORGANIZATION WORKSPACE"}</Text>
      <IconTile badge={target.emoji} size={28} />
      <Text accessibilityRole="header" style={dashboardStyles.heroTitle}>{target.title}</Text>
      <Text style={dashboardStyles.heroBody}>{target.description}</Text>
      <Text style={dashboardStyles.heroBody}>{userDirectory ? organization ? `Users in ${organization.name}` : "Choose an organization card to open its user accounts." : help ? "Open a guide card to read its full instructions." : platformReports ? "Explore workspace coverage, billing, payments and operations. Tap a card for the full report." : "Select a record to open its full native page."}</Text>
    </View>
    {userDirectory && organization ? <Button label="All organizations" icon="arrow-left" secondary disabled={busy} onPress={() => { setOrganization(null); setPage(1); setQuery(""); setSearch(""); setExpanded(null); }} /> : null}
    {reviewPayments && target.kind === "organization" && target.path === "/dashboard/org/payments" ? <Button label="Review pending payments" icon="check-circle" onPress={reviewPayments} /> : null}
    {data?.actions?.length ? <DashboardSection title={jobQueue ? "Job controls" : "Manage this page"}><View style={jobQueue ? gridStyles.grid : { gap: 10 }}>{data.actions.map(item => jobQueue
      ? <FeatureCard key={item.id} title={item.title} description={item.destructive ? "Review and confirm this operation." : "Open options to continue."} icon={item.destructive ? "shield" : "play"} compact style={grid.cell} disabled={busy} onPress={() => setAction({ actionId: item.id })} />
      : <Button key={item.id} label={item.title} icon={item.destructive ? "shield" : "plus"} secondary={item.destructive} disabled={busy} onPress={() => setAction({ actionId: item.id })} />)}</View></DashboardSection> : null}
    {data?.searchable !== false ? <View style={[styles.card, { gap: 12 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><AppIcon name="search" /><Text style={styles.label}>Find a record</Text></View>
      <TextInput accessibilityLabel={`Search ${target.title}`} placeholder="Search records…" placeholderTextColor="#62766a" style={styles.input} value={query} onChangeText={setQuery} maxLength={100} autoCorrect={false} returnKeyType="search" onSubmitEditing={applySearch} editable={!busy} />
      <View style={dashboardStyles.row}><Button label="Search" icon="search" onPress={applySearch} disabled={busy} />{search || query ? <Button label="Clear" secondary disabled={busy} onPress={() => { setQuery(""); setSearch(""); setPage(1); setRevision(value => value + 1); }} /> : null}</View>
    </View> : null}
    {busy ? <View style={styles.card}><ActivityIndicator accessibilityLabel={`Loading ${target.title}`} color="#14634e" /><Text style={styles.subtitle}>Loading your records…</Text></View> : null}
    {error ? <View style={styles.card}><IconTile name="wifi-off" /><Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text><Button label="Try again" icon="refresh-cw" onPress={() => setRevision(value => value + 1)} /></View> : null}
    {data?.notice ? <Text accessibilityRole="alert" style={dashboardStyles.notice}>{data.notice}</Text> : null}
    {data ? <>
      <DashboardSection title={platformReports ? "Platform reports" : userDirectory ? organization?.name ?? "Organizations" : jobQueue ? target.path.endsWith("/notifications") ? "Notification queue" : "Job runs" : help ? "Guides" : "Records"} description={platformReports ? `${data.records.length} report cards · Tap any card to explore its details` : `Page ${data.page} · ${data.records.length} shown${data.hasMore ? " · More available" : ""}`}>
        {data.records.length ? platformReports ? <NativeReportCards records={data.records} busy={busy} open={setExpanded} /> : userDirectory ? <View style={gridStyles.grid}>{data.records.map(record => <FeatureCard key={record.id} title={record.title} description={[record.subtitle, ...record.fields.slice(0, 2).map(field => `${field.label}: ${field.value}`), record.status?.replaceAll("_", " ")].filter(Boolean).join(" · ")} badge={record.organizationGroup ? "🏢" : "👤"} style={grid.cell} disabled={busy} onPress={() => {
          if (record.organizationGroup) { setOrganization({ id: record.organizationGroup, name: record.title }); setPage(1); setQuery(""); setSearch(""); }
          else void openUser(record.id);
        }} />)}</View> : <NativeRecordList key={`${target.path}:${data.page}:${search}`} records={data.records} title={target.title} emoji={target.emoji} cards={jobQueue} open={setExpanded} /> : null}
        {!data.records.length ? <View style={styles.card}><IconTile name={search ? "search" : "inbox"} /><Text style={styles.cardTitle}>{search ? "No matching records" : data.notice ? "No records available in this view" : "No records yet"}</Text><Text style={styles.subtitle}>{search ? "Try another name or clear your search." : "Refresh to check for updates."}</Text></View> : null}
      </DashboardSection>
      {!platformReports ? <View style={dashboardStyles.row}>
        <Button label="Previous" icon="arrow-left" secondary disabled={busy || page <= 1} onPress={() => setPage(value => value - 1)} />
        <Text accessibilityLiveRegion="polite" style={styles.label}>Page {page}</Text>
        <Button label="Next" icon="arrow-right" secondary disabled={busy || !data.hasMore} onPress={() => setPage(value => value + 1)} />
      </View> : null}
      {data.related.length ? <DashboardSection title="Related tools"><View style={gridStyles.grid}>{data.related.map(link => <FeatureCard key={link.path} title={link.title} description={link.description} badge={link.emoji} disabled={busy} style={grid.cell} onPress={() => open({ ...link, kind: target.kind })} />)}</View></DashboardSection> : null}
      <Button label={platformReports ? "Refresh reports" : "Refresh records"} icon="refresh-cw" disabled={busy} secondary onPress={() => setRevision(value => value + 1)} />
    </> : null}
  </View>;
}

export function NativeWorkspace(props: Parameters<typeof NativeRecordWorkspace>[0]) {
  return props.target.kind === "platform" && props.target.path === "/platform/reports"
    ? <NativePlatformReports onError={props.onError} />
    : <NativeRecordWorkspace {...props} />;
}
