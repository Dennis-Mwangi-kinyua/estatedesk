import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, Text, TextInput, View } from "react-native";
import type { MobileSession, MobileWorkspaceDashboard, MobileWorkspaceKind } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { linksForManagementMode, type ManagementMode } from "../management-navigation";
import { AppIcon } from "./app-icon";
import { useCardGrid, cardGridStyles as g } from "./card-grid";
import { DashboardAction, DashboardSection, dashboardStyles as s } from "./dashboard-ui";
import { Button, styles } from "./ui";
import { useDashboardResume } from "./use-dashboard-resume";

/** Native dashboard; individual additional workflows can open the authenticated workspace. */
export function ManagementHome({ session, busy, onError, initialKind, openNative, openWeb }: {
  session: MobileSession; busy: boolean; onError: (error: unknown) => void; initialKind?: MobileWorkspaceKind;
  openNative: (screen: "portfolio" | "payment-review" | "gate" | "notifications") => void;
  openWeb: (kind: MobileWorkspaceKind, path: string) => void;
}) {
  const organization = !!session.organizationId && ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.role ?? "");
  const platform = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole) || ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.role ?? "");
  const [mode, setMode] = useState<ManagementMode>(initialKind === "platform" || !organization ? "admin" : "organization");
  const kind = mode === "organization" ? "organization" : "platform";
  const [data, setData] = useState<MobileWorkspaceDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const grid = useCardGrid();
  const refresh = () => { if (!busy && !loading) setRevision(value => value + 1); };
  useDashboardResume(refresh);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setData(null);
    void api.getWorkspaceDashboard(kind).then(value => { if (active) setData(value); }).catch(cause => {
      if (!active) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      else setError(cause instanceof Error ? cause.message : "Unable to load dashboard.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, revision, onError, session]);
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
    if (kind === "organization") {
      if (path === "/dashboard/org/units" && session.features.includes("portfolio")) return openNative("portfolio");
      if (path === "/dashboard/org/payments" && session.features.includes("payment-review")) return openNative("payment-review");
      if (path === "/dashboard/gate" && session.features.includes("gate")) return openNative("gate");
    }
    openWeb(kind, path);
  }
  return <View style={s.root} onLayout={grid.onLayout}>
    <View style={styles.card}>
      <Text style={s.eyebrow}>ESTATEDESK</Text>
      <Text accessibilityRole="header" style={styles.title}>{mode === "organization" ? session.organizationName ?? "Dashboard" : mode === "developer" ? "Developer portal" : "Platform admin"}</Text>
      <Text style={s.body}>Welcome, {session.fullName.split(" ")[0]}</Text>
      <View style={[s.row, { alignItems: "stretch" }]}>
        {([...organization ? ["organization" as const] : [], ...platform ? ["admin" as const, "developer" as const] : []]).map(value => <Button key={value} label={value === "organization" ? "Dashboard" : value === "admin" ? "Admin" : "Developer"} selected={mode === value} secondary={mode !== value} disabled={busy} onPress={() => { setMode(value); setQuery(""); }} />)}
      </View>
    </View>
    {loading ? <ActivityIndicator accessibilityLabel="Loading dashboard" color="#14634e" /> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {data?.partial ? <Text style={s.notice}>Some summaries are unavailable. Your tools remain accessible.</Text> : null}
    {data && mode !== "developer" ? <DashboardSection title="Overview"><View style={g.grid}>{data.metrics.map(metric => <Pressable key={metric.title} accessibilityRole="button" accessibilityLabel={`${metric.title}: ${metric.value}`} disabled={busy} onPress={() => open(metric.path)} style={({ pressed }) => [g.card, grid.cell, pressed && g.pressed, busy && g.disabled]}>
      <AppIcon badge={metric.emoji} /><Text style={s.metricLabel}>{metric.title}</Text><Text style={s.metricValue}>{metric.value}</Text><Text style={s.caption}>{metric.detail}</Text>
    </Pressable>)}</View></DashboardSection> : null}
    <TextInput accessibilityLabel="Search dashboard tools" placeholder="Search tools…" placeholderTextColor="#62766a" value={query} onChangeText={setQuery} style={[styles.input, { backgroundColor: "#ffffff" }]} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} autoCorrect={false} />
    {groups.map(([group, links]) => <DashboardSection key={group} title={group}><View style={g.grid}>{links.map(link => <Pressable key={link.path} accessibilityRole="button" accessibilityLabel={link.title} accessibilityHint={link.description} accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => open(link.path)} style={({ pressed }) => [g.card, grid.cell, pressed && g.pressed, busy && g.disabled]}>
      <View style={[s.iconBadge, { backgroundColor: "#eef3f8" }]}><AppIcon badge={link.emoji} size={24} /></View>
      <Text style={s.cardTitle}>{link.title}</Text><Text style={s.body}>{link.description}</Text>
      <View accessible={false} style={g.footer}><Text style={g.footerText}>Open</Text><AppIcon name="arrow-right" size={16} /></View>
    </Pressable>)}</View></DashboardSection>)}
    {!loading && groups.length === 0 ? <Text style={s.body}>{query ? "No tools match your search." : "No tools are available for this account."}</Text> : null}
    <DashboardAction title={loading ? "Refreshing…" : "Refresh dashboard"} emoji="🔄" onPress={refresh} disabled={busy || loading} />
  </View>;
}
