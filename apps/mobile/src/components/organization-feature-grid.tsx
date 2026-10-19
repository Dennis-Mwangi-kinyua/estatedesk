import { FeatureCard } from "./feature-card";
import { useCardGrid, cardGridStyles } from "./card-grid";
import { AppIcon } from "./app-icon";
import { useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { MobileWorkspaceLink } from "@estatedesk/contracts/mobile";

/** One continuous, equal-cell directory: every authorized feature gets a card. */
export function OrganizationFeatureGrid({ links, name, busy, loading, error, open, refresh, notifications, platform }: {
  links: MobileWorkspaceLink[]; name: string; busy: boolean; loading: boolean; error: string;
  open: (path: string) => void; refresh: () => void; notifications: () => void;
  platform?: () => void;
}) {
  const [query, setQuery] = useState("");
  const cardGrid = useCardGrid();
  const features = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return links.filter(link => !needle || `${link.title} ${link.description} ${link.group}`.toLowerCase().includes(needle));
  }, [links, query]);
  return <View style={styles.page} onLayout={cardGrid.onLayout}>
    <View style={styles.header}>
      <Text style={styles.eyebrow}>ESTATEDESK · ORGANIZATION</Text>
      <Text accessibilityRole="header" style={styles.title}>{name}</Text>
      <Text style={styles.description}>All your organization features, in one place.</Text>
    </View>
    {platform ? <Pressable accessibilityRole="button" disabled={busy} onPress={platform} style={styles.control}><AppIcon name="globe" size={20} /><Text style={styles.controlText}>Switch to platform dashboard</Text></Pressable> : null}
    <View style={styles.searchRow}>
      <TextInput accessibilityLabel="Search all organization features" value={query} onChangeText={setQuery} placeholder="Search any feature…" placeholderTextColor="#708075" autoCorrect={false} maxLength={100} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} style={styles.search} />
      {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear feature search" onPress={() => setQuery("")} style={styles.clear}><Text style={styles.controlText}>Clear</Text></Pressable> : null}
    </View>
    <Text accessibilityLiveRegion="polite" style={styles.count}>{features.length} {query ? "matching" : "available"} features</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {loading && links.length === 0 ? <ActivityIndicator accessibilityLabel="Loading organization features" color="#14634e" /> : null}
    <View style={cardGridStyles.grid}>{features.map(link => <FeatureCard key={link.path} title={link.title} description={link.description} badge={link.emoji} disabled={busy} style={cardGrid.cell} onPress={() => { Keyboard.dismiss(); open(link.path); }} />)}</View>
    {!loading && features.length === 0 ? <Text style={styles.description}>{query ? "No features match. Try another name or clear the search." : "No organization features are available for this account."}</Text> : null}
    <View style={styles.controls}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={notifications} style={styles.control}><AppIcon name="bell" size={20} /><Text style={styles.controlText}>My notifications</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy || loading} onPress={refresh} style={[styles.control, (busy || loading) && styles.pressed]}><AppIcon name="refresh-cw" size={20} /><Text style={styles.controlText}>{loading ? "Refreshing…" : "Refresh features"}</Text></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  page: { gap: 16 }, header: { gap: 8 }, eyebrow: { color: "#587464", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: "#173e32", fontSize: 27, lineHeight: 35, fontWeight: "700" }, description: { color: "#5d7165", fontSize: 14, lineHeight: 21 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 }, search: { flex: 1, minWidth: 0, minHeight: 54, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: "#dbe6dd", backgroundColor: "#fff", color: "#173e32", fontSize: 16 }, clear: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  count: { color: "#64766a", fontSize: 12 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#dde7df", borderRadius: 18, padding: 16, gap: 9, flexGrow: 0, flexShrink: 0 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" }, emoji: { fontSize: 26, lineHeight: 34 },
  cardTitle: { color: "#214532", fontSize: 15, lineHeight: 21, fontWeight: "700" }, category: { color: "#708075", fontSize: 11, lineHeight: 16 },
  openRow: { marginTop: "auto", flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#edf2ed", paddingTop: 9 }, open: { color: "#236446", fontSize: 12, fontWeight: "600" }, arrow: { color: "#6d8575", fontSize: 19 },
  controls: { gap: 10, marginTop: 10 }, control: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#e9f0e9", borderRadius: 12, padding: 14, minHeight: 48 }, controlText: { flexShrink: 1, color: "#315640", fontSize: 13, fontWeight: "600" },
  error: { backgroundColor: "#fff2dc", color: "#79591e", padding: 14, borderRadius: 12, lineHeight: 21 }, pressed: { opacity: 0.55 },
});
