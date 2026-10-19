import { FeatureCard } from "./feature-card";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, Text, TextInput, View } from "react-native";
import type { MobileSession, MobileWorkspaceDashboard, MobileWorkspaceKind } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { linksForManagementMode, type ManagementMode } from "../management-navigation";
import type { WorkspaceTarget } from "./native-workspace";
import { AppIcon, IconTile } from "./app-icon";
import { useCardGrid, cardGridStyles as g } from "./card-grid";
import { DashboardAction, DashboardSection, dashboardStyles as s } from "./dashboard-ui";
import { Button, styles } from "./ui";
import { useDashboardResume } from "./use-dashboard-resume";

/** Native dashboard and authorized native record tools. */
export function ManagementHome({ session, busy, onError, initialKind, openNative, openTool, active = true }: {
  session: MobileSession; busy: boolean; active?: boolean; onError: (error: unknown) => void; initialKind?: MobileWorkspaceKind;
  openNative: (screen: "portfolio" | "payment-review" | "gate" | "notifications" | "security") => void;
  openTool: (target: WorkspaceTarget) => void;
}) {
  const organization = !!session.organizationId && ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.role ?? "");
  const platform = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole) || ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.role ?? "");
  const [mode, setMode] = useState<ManagementMode>(initialKind === "platform" || !organization ? "admin" : "organization");
  const kind = mode === "organization" ? "organization" : "platform";
  const dataKey = JSON.stringify([session.userId, session.organizationId, session.role, session.platformRole, mode]);
  const [loaded, setLoaded] = useState<{ key: string; value: MobileWorkspaceDashboard } | null>(null);
  const data = loaded?.key === dataKey ? loaded.value : null;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const grid = useCardGrid();
  const refresh = () => { if (!busy && !loading) setRevision(value => value + 1); };
  useDashboardResume(refresh, active);
  useEffect(() => {
    if (!active) return;
    let current = true;
    // Keep real records visible during refresh; a different account/mode never sees them.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError("");
    void api.getWorkspaceDashboard(kind, mode === "developer" ? "developer" : "summary").then(value => { if (current) setLoaded({ key: dataKey, value }); }).catch(cause => {
      if (!current) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      else setError(cause instanceof Error ? cause.message : "Unable to load dashboard.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [kind, mode, revision, onError, session, active, dataKey]);
  const groups = useMemo(() => {
    const result = new Map<string, NonNullable<typeof data>["links"]>();
    for (const link of linksForManagementMode(data?.links ?? [], mode)) {
      if (link.path === "/dashboard/org" || link.path === "/platform" || link.path === "/platform/developer") continue;
      if (query.trim() && !`${link.title} ${link.description} ${link.group}`.toLowerCase().includes(query.trim().toLowerCase())) continue;
      result.set(link.group, [...(result.get(link.group) ?? []), link]);
    }
    return [...result];
  }, [data, mode, query]);
  function open(path: string) {
    Keyboard.dismiss();
    if (["/dashboard/security", "/dashboard/org/security", "/dashboard/caretaker/security"].includes(path)) return openNative("security");
    if (kind === "organization") {
      if (path === "/dashboard/org/units" && session.features.includes("portfolio")) return openNative("portfolio");
      if (path === "/dashboard/org/notifications") return openNative("notifications");
      if (path === "/dashboard/gate" && session.features.includes("gate")) return openNative("gate");
    }
    const link = data?.links.find(link => link.path === path);
    if (link) openTool({ kind, ...link });
  }
  return <View style={s.root} onLayout={grid.onLayout}>
    <View style={styles.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><IconTile name={mode === "organization" ? "briefcase" : mode === "developer" ? "code" : "shield"} /><View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={[s.eyebrow, { color: "#718279" }]}>{mode === "organization" ? "WORKSPACE" : mode === "developer" ? "DEVELOPER" : "PLATFORM"}</Text>
        <Text accessibilityRole="header" style={[styles.cardTitle, { fontSize: 22, lineHeight: 29 }]}>{mode === "organization" ? session.organizationName ?? "Dashboard" : mode === "developer" ? "Developer portal" : "Platform admin"}</Text>
      </View></View>
      <Text style={s.body}>{mode === "organization" ? "Properties and daily operations" : mode === "developer" ? "Developer tools and integrations" : "Organizations, people, and platform services"}</Text>
      <View style={[s.row, { alignItems: "stretch" }]}>
        {([...organization ? ["organization" as const] : [], ...platform ? ["admin" as const, "developer" as const] : []]).map(value => <Button key={value} label={value === "organization" ? "Dashboard" : value === "admin" ? "Admin" : "Developer"} selected={mode === value} secondary={mode !== value} disabled={busy} onPress={() => { setMode(value); setQuery(""); }} />)}
      </View>
    </View>
    {loading ? <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><ActivityIndicator accessibilityLabel={data ? "Refreshing dashboard" : "Loading dashboard"} color="#14634e" /><Text accessibilityLiveRegion="polite" style={s.caption}>{data ? "Refreshing your latest data…" : "Loading your workspace…"}</Text></View> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}{data ? " Previously loaded data is shown. Refresh to try again." : ""}</Text> : null}
    {data?.partial ? <Text style={s.notice}>Some summaries are unavailable. Refresh to try again.</Text> : null}
    {data ? <DashboardSection title="Overview"><View style={g.grid}>{data.metrics.map(metric => <Pressable key={metric.title} accessibilityRole="button" accessibilityLabel={`${metric.title}: ${metric.value}`} disabled={busy} onPress={() => open(metric.path)} style={({ pressed }) => [g.card, grid.cell, pressed && g.pressed, busy && g.disabled]}>
      <IconTile badge={metric.emoji} /><Text style={s.metricLabel}>{metric.title}</Text><Text style={s.metricValue}>{metric.value}</Text><Text style={s.caption}>{metric.detail}</Text><View style={g.footer}><Text style={g.footerText}>View details</Text><AppIcon name="arrow-right" size={16} /></View>
    </Pressable>)}</View></DashboardSection> : null}
    <TextInput accessibilityLabel="Search dashboard tools" placeholder="Search tools…" placeholderTextColor="#62766a" value={query} onChangeText={setQuery} style={[styles.input, { backgroundColor: "#ffffff" }]} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} autoCorrect={false} />
    {groups.map(([group, links]) => <DashboardSection key={group} title={group}><View style={g.grid}>{links.map(link => <FeatureCard key={link.path} title={link.title} description={link.description} badge={link.emoji} disabled={busy} style={grid.cell} onPress={() => open(link.path)} />)}</View></DashboardSection>)}
    {!loading && groups.length === 0 ? <Text style={s.body}>{query ? "No tools match your search." : "No tools are available for this account."}</Text> : null}
    {data ? <DashboardSection title="Recent activity" description={`Updated ${new Date(data.updatedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })} · Latest updates for your account.`}>
      <View style={styles.card}>{data.updates.length ? data.updates.slice(0, 3).map(item => <View key={item.id} style={[s.activity, { flexDirection: "row", gap: 12 }]}><IconTile name="clock" size={18} /><View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text style={s.caption}>{new Date(item.createdAt).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short" })}</Text>
        <Text style={s.cardTitle}>{item.title}</Text><Text style={s.body}>{item.message}</Text>
      </View></View>) : <Text style={s.body}>{data.partial ? "Recent activity is unavailable. Refresh to try again." : "No recent activity yet."}</Text>}</View>
    </DashboardSection> : null}
    <DashboardAction title={loading ? "Refreshing…" : "Refresh dashboard"} emoji="🔄" onPress={refresh} disabled={busy || loading} />
  </View>;
}
