import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { AppIcon, IconTile } from "./app-icon";
import { useCardGrid, cardGridStyles as g } from "./card-grid";
import { Button, styles } from "./ui";
import { dashboardStyles as s } from "./dashboard-ui";
type Destination = "bills" | "work-orders" | "inspections" | "portfolio" | "payment-review";
type Tile = { label: string; value: string; badge: string; target: Destination };
export function Dashboard({ session, open, busy }: { session: MobileSession; open: (target: Destination) => void; busy: boolean }) {
  const [tiles, setTiles] = useState<Tile[]>([]); const [error, setError] = useState(""); const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const grid = useCardGrid();
  useEffect(() => {
    let active = true;
    setLoading(true);
    const tasks: Promise<Tile>[] = [];
    if (session.role === "TENANT" && session.canViewBills) tasks.push(api.getBills().then(data => ({ label: "Outstanding balance", value: new Intl.NumberFormat("en-KE", { style: "currency", currency: data.currencyCode }).format(data.totalBalance), badge: "💳", target: "bills" })));
    if (session.features.includes("caretaker-issues")) tasks.push(api.getWorkOrders().then(data => ({ label: "Active work · latest 100", value: String(data.filter(item => !["CLOSED", "RESOLVED", "CANCELLED"].includes(item.status)).length), badge: "🛠️", target: "work-orders" })));
    if (session.features.includes("inspections")) tasks.push(api.getInspections().then(data => ({ label: "Scheduled inspections · latest 100", value: String(data.filter(item => item.status === "SCHEDULED").length), badge: "📋", target: "inspections" })));
    if (session.features.includes("portfolio")) tasks.push(api.getPortfolio("", "VACANT").then(data => ({ label: "Vacant units in your portfolio", value: String(data.total), badge: "🏡", target: "portfolio" })));
    if (session.features.includes("payment-review")) tasks.push(api.getReviewPayments().then(data => ({ label: "Payments awaiting review", value: `${data.payments.length}${data.hasMore ? "+" : ""}`, badge: "🧾", target: "payment-review" })));
    void Promise.allSettled(tasks).then(results => {
      if (!active) return;
      setTiles(results.flatMap(result => result.status === "fulfilled" ? [result.value] : []));
      setError(results.some(result => result.status === "rejected") ? "Some summaries could not load. Refresh when connected." : ""); setLoading(false);
    });
    return () => { active = false; };
  }, [session, version]);
  return <View onLayout={grid.onLayout} style={{ gap: 14 }}>
    {loading ? <ActivityIndicator accessibilityLabel="Loading summaries" color="#14634e" /> : null}
    <View style={g.grid}>{tiles.map(tile => <Pressable key={tile.target} accessibilityRole="button" accessibilityLabel={`${tile.label}: ${tile.value}`} accessibilityHint="Open details" disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => open(tile.target)} style={({ pressed }) => [g.card, grid.cell, pressed && g.pressed, busy && g.disabled]}>
      <IconTile badge={tile.badge} />
      <Text style={s.metricLabel}>{tile.label}</Text><Text style={s.metricValue}>{tile.value}</Text>
      <View accessible={false} style={g.footer}><Text style={g.footerText}>View details</Text><AppIcon name="arrow-right" size={16} /></View>
    </Pressable>)}</View>
    {error ? <Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text> : null}
    <Button label="Refresh dashboard" disabled={busy || loading} secondary onPress={() => setVersion(value => value + 1)} />
  </View>;
}
