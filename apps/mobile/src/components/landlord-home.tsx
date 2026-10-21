import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { MobileSession, MobileWorkspaceDashboard, MobileWorkspaceLink } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { FeatureCard } from "./feature-card";
import { useCardGrid, cardGridStyles as grid } from "./card-grid";
import { DashboardSection, dashboardStyles } from "./dashboard-ui";
import { styles, Button } from "./ui";
import { useDashboardResume } from "./use-dashboard-resume";

export function LandlordHome({ session, busy, refreshKey, active, open, onError }: {
  session: MobileSession; busy: boolean; refreshKey: number; active: boolean;
  open: (link: MobileWorkspaceLink) => void; onError: (error: unknown) => void;
}) {
  const [data, setData] = useState<MobileWorkspaceDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const layout = useCardGrid();
  useDashboardResume(() => setRevision(value => value + 1), active);
  useEffect(() => {
    if (!active) return;
    let mounted = true;
    setLoading(true); setError("");
    void api.getWorkspaceDashboard("landlord").then(result => { if (mounted) setData(result); }).catch(cause => {
      if (!mounted) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      else setError(cause instanceof Error ? cause.message : "Unable to load your landlord workspace.");
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [active, refreshKey, revision, onError, session]);
  return <View style={{ gap: 22 }} onLayout={layout.onLayout}>
    <View style={[styles.card, { gap: 8, padding: 22 }]}>
      <Text style={dashboardStyles.eyebrow}>LANDLORD WORKSPACE</Text>
      <Text accessibilityRole="header" style={styles.cardTitle}>Welcome, {session.fullName.split(" ")[0] || "landlord"}</Text>
      <Text style={styles.subtitle}>Review your assigned portfolio, owner statements and recorded payouts.</Text>
    </View>
    {loading ? <View style={styles.card}><ActivityIndicator color="#14634e" /></View> : null}
    {error ? <View style={styles.card}><DashboardSection title="Workspace unavailable" description={error}><View /></DashboardSection><Button label="Try again" icon="refresh-cw" onPress={() => setRevision(value => value + 1)} disabled={busy} /></View> : null}
    {data?.metrics.length ? <DashboardSection title="Portfolio at a glance"><View style={grid.grid}>{data.metrics.map(metric => <FeatureCard key={metric.title} title={metric.value} description={metric.title} badge={metric.emoji} style={layout.cell} disabled={busy} onPress={() => { const link = data.links.find(item => item.path === metric.path); if (link) open(link); }} />)}</View></DashboardSection> : null}
    {data?.links.map((link, index) => index === 0 || data.links[index - 1].group !== link.group ? <DashboardSection key={link.group} title={link.group}><View style={grid.grid}>{data.links.filter(item => item.group === link.group).map(item => <FeatureCard key={item.path} title={item.title} description={item.description} badge={item.emoji} style={layout.cell} disabled={busy} onPress={() => open(item)} />)}</View></DashboardSection> : null)}
    {data && !data.links.length ? <View style={styles.card}><DashboardSection title="No landlord workspace" description="No active landlord profile is linked to this account."><View /></DashboardSection></View> : null}
    <Button label="Refresh workspace" icon="refresh-cw" secondary disabled={busy || loading} onPress={() => setRevision(value => value + 1)} />
  </View>;
}
