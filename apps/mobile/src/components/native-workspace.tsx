import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, Text, TextInput, View } from "react-native";
import type { MobileWorkspaceKind, NativeWorkspacePage } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { AppIcon, IconTile } from "./app-icon";
import { useCardGrid, cardGridStyles as gridStyles } from "./card-grid";
import { DashboardSection, dashboardStyles } from "./dashboard-ui";
import { Button, styles } from "./ui";
import { NativeActionForm } from "./native-action-form";
import { NativeRecordList } from "./native-record-list";
import { WorkspaceRecordPage } from "./workspace-record-page";

export type WorkspaceTarget = { kind: MobileWorkspaceKind; path: string; title: string; emoji: string; description: string };

/** Native record browser. Never renders HTML, remote scripts, or a WebView. */
export function NativeWorkspace({ target, open, onError, reviewPayments, help = false, onMutationBusy = () => {}, onContextChange }: { target: WorkspaceTarget; open: (target: WorkspaceTarget) => void; onError: (error: unknown) => void; reviewPayments?: () => void; help?: boolean; onMutationBusy?: (busy: boolean) => void; onContextChange?: () => Promise<void> }) {
  const [action, setAction] = useState<{ actionId: string; recordId?: string } | null>(null);
  const [data, setData] = useState<NativeWorkspacePage | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const previousQuery = useRef("");
  const grid = useCardGrid();
  const detail = data?.records.find(record => record.id === expanded);
  useEffect(() => {
    let active = true;
    const queryKey = JSON.stringify([target.kind, target.path, search, page, help]);
    const changedQuery = previousQuery.current !== queryKey;
    previousQuery.current = queryKey;
    // Keep the current records and detail visible during a refresh. A different
    // search or page must never display records belonging to the previous query.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusy(true); setError("");
    if (changedQuery) { setData(null); setExpanded(null); }
    void (help ? api.getHelp(search, page) : api.getNativeWorkspace(target.kind, target.path, search, page)).then(result => {
      if (active) setData(result);
    }).catch(cause => {
      if (!active) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      else setError(cause instanceof Error ? cause.message : "Unable to load records.");
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [target.kind, target.path, search, page, revision, onError, help]);
  const applySearch = () => { if (!busy) { Keyboard.dismiss(); setPage(1); setSearch(query.trim()); setRevision(value => value + 1); } };
  const actionForm = action ? <NativeActionForm request={{ kind: target.kind, path: target.path, ...action }} onError={onError} onBusyChange={onMutationBusy} close={(completed, contextChanged) => { setAction(null); if (contextChanged && onContextChange) void onContextChange().catch(onError); else if (completed) setRevision(value => value + 1); }} /> : null;
  return <View style={{ gap: 22 }} onLayout={grid.onLayout}>
    {detail ? <WorkspaceRecordPage record={detail} workspace={target.title} emoji={target.emoji} close={() => setExpanded(null)} act={(actionId, recordId) => setAction({ actionId, recordId })}>{actionForm}</WorkspaceRecordPage> : actionForm}
    <View style={dashboardStyles.hero}>
      <Text style={dashboardStyles.eyebrow}>{target.kind === "platform" ? "PLATFORM WORKSPACE" : "ORGANIZATION WORKSPACE"}</Text>
      <IconTile badge={target.emoji} size={28} />
      <Text accessibilityRole="header" style={dashboardStyles.heroTitle}>{target.title}</Text>
      <Text style={dashboardStyles.heroBody}>{target.description}</Text>
      <Text style={dashboardStyles.heroBody}>{help ? "Open a guide card to read its full instructions." : "Select a record to open its full native page."}</Text>
    </View>
    {reviewPayments && target.kind === "organization" && target.path === "/dashboard/org/payments" ? <Button label="Review pending payments" icon="check-circle" onPress={reviewPayments} /> : null}
    {data?.actions?.length ? <DashboardSection title="Manage this page"><View style={{ gap: 10 }}>{data.actions.map(item => <Button key={item.id} label={item.title} icon={item.destructive ? "shield" : "plus"} secondary={item.destructive} disabled={busy} onPress={() => setAction({ actionId: item.id })} />)}</View></DashboardSection> : null}
    {data?.searchable !== false ? <View style={[styles.card, { gap: 12 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><AppIcon name="search" /><Text style={styles.label}>Find a record</Text></View>
      <TextInput accessibilityLabel={`Search ${target.title}`} placeholder="Search records…" placeholderTextColor="#62766a" style={styles.input} value={query} onChangeText={setQuery} maxLength={100} autoCorrect={false} returnKeyType="search" onSubmitEditing={applySearch} editable={!busy} />
      <View style={dashboardStyles.row}><Button label="Search" icon="search" onPress={applySearch} disabled={busy} />{search || query ? <Button label="Clear" secondary disabled={busy} onPress={() => { setQuery(""); setSearch(""); setPage(1); setRevision(value => value + 1); }} /> : null}</View>
    </View> : null}
    {busy ? <View style={styles.card}><ActivityIndicator accessibilityLabel={`Loading ${target.title}`} color="#14634e" /><Text style={styles.subtitle}>Loading your records…</Text></View> : null}
    {error ? <View style={styles.card}><IconTile name="wifi-off" /><Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text><Button label="Try again" icon="refresh-cw" onPress={() => setRevision(value => value + 1)} /></View> : null}
    {data?.notice ? <Text accessibilityRole="alert" style={dashboardStyles.notice}>{data.notice}</Text> : null}
    {data ? <>
      <DashboardSection title={help ? "Guides" : "Records"} description={`Page ${data.page} · ${data.records.length} shown${data.hasMore ? " · More available" : ""}`}>
        {data.records.length ? <NativeRecordList key={`${target.path}:${data.page}:${search}`} records={data.records} title={target.title} emoji={target.emoji} open={setExpanded} /> : null}
        {!data.records.length ? <View style={styles.card}><IconTile name={search ? "search" : "inbox"} /><Text style={styles.cardTitle}>{search ? "No matching records" : data.notice ? "No records available in this view" : "No records yet"}</Text><Text style={styles.subtitle}>{search ? "Try another name or clear your search." : "Refresh to check for updates."}</Text></View> : null}
      </DashboardSection>
      <View style={dashboardStyles.row}>
        <Button label="Previous" icon="arrow-left" secondary disabled={busy || page <= 1} onPress={() => setPage(value => value - 1)} />
        <Text accessibilityLiveRegion="polite" style={styles.label}>Page {page}</Text>
        <Button label="Next" icon="arrow-right" secondary disabled={busy || !data.hasMore} onPress={() => setPage(value => value + 1)} />
      </View>
      {data.related.length ? <DashboardSection title="Related tools"><View style={gridStyles.grid}>{data.related.map(link => <Pressable key={link.path} accessibilityRole="button" accessibilityLabel={link.title} disabled={busy} onPress={() => open({ ...link, kind: target.kind })} style={({ pressed }) => [gridStyles.card, grid.cell, pressed && gridStyles.pressed]}>
        <IconTile badge={link.emoji} /><Text style={dashboardStyles.cardTitle}>{link.title}</Text><Text style={styles.subtitle}>{link.description}</Text><View style={gridStyles.footer}><Text style={gridStyles.footerText}>Open tool</Text><AppIcon name="arrow-right" size={16} /></View>
      </Pressable>)}</View></DashboardSection> : null}
      <Button label="Refresh records" icon="refresh-cw" disabled={busy} secondary onPress={() => setRevision(value => value + 1)} />
    </> : null}
  </View>;
}
