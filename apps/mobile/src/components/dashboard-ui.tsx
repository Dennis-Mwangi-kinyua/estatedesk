import { AppIcon } from "./app-icon";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

export function DashboardAction({ title, hint, emoji, onPress, disabled, dark = false, centered = false }: { title: string; hint?: string; emoji?: string; onPress: () => void; disabled?: boolean; dark?: boolean; centered?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={hint} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [dashboardStyles.action, centered && { justifyContent: "center" }, dark && dashboardStyles.actionDark, (pressed || disabled) && dashboardStyles.pressed]}>
    {emoji ? <AppIcon badge={emoji} size={22} color={dark ? "#ffffff" : undefined} /> : null}
    <Text style={[dashboardStyles.actionText, centered && { textAlign: "center" }, dark && dashboardStyles.white]}>{title}</Text><Text accessible={false} style={[dashboardStyles.arrow, dark && dashboardStyles.white]}>→</Text>
  </Pressable>;
}
export function DashboardSection({ title, description, emoji, children }: { title: string; description?: string; emoji?: string; children: ReactNode }) {
  return <View style={dashboardStyles.section}><View style={dashboardStyles.sectionHeading}><View style={dashboardStyles.sectionTitleRow}>{emoji ? <AppIcon badge={emoji} size={24} /> : null}<Text accessibilityRole="header" style={[dashboardStyles.sectionTitle, dashboardStyles.flex]}>{title}</Text></View>{description ? <Text style={dashboardStyles.body}>{description}</Text> : null}</View>{children}</View>;
}
export const dashboardStyles = StyleSheet.create({
  searchInput: { minHeight: 50, backgroundColor: "#fff", color: "#173e32", borderColor: "#dee7e1", borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
  root: { gap: 28 }, flex: { flex: 1, minWidth: 0 },
  hero: { backgroundColor: "#123c32", borderRadius: 24, padding: 24, gap: 18, overflow: "hidden" },
  heroTop: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between" },
  eyebrow: { color: "#b4d5c6", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  portalBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "#285447" }, portalBadgeText: { fontSize: 9, letterSpacing: 1, fontWeight: "700", color: "#dcf0e4" },
  heroTitle: { fontSize: 32, lineHeight: 39, fontWeight: "700", color: "#ffffff", letterSpacing: -0.8 },
  heroBody: { color: "#d0e4da", fontSize: 15, lineHeight: 23 },
  organization: { flexDirection: "row", alignItems: "center", gap: 8 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#9cd5b6" }, organizationText: { color: "#d0e4da", fontSize: 13, flex: 1 },
  actionEmoji: { fontSize: 20, lineHeight: 28 }, sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 }, sectionEmoji: { fontSize: 22, lineHeight: 30 },
  metricHeading: { flexDirection: "row", alignItems: "center", gap: 8 }, metricEmoji: { fontSize: 20, lineHeight: 28 },
  section: { gap: 14 }, sectionHeading: { gap: 5 }, sectionTitle: { color: "#173e32", fontSize: 21, fontWeight: "700", letterSpacing: -0.4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, half: { width: "48%", flexGrow: 1, flexBasis: "45%", minWidth: 0 }, full: { width: "100%" },
  metric: { backgroundColor: "#ffffff", borderRadius: 18, borderWidth: 1, borderColor: "#dee7e1", padding: 16, gap: 10 },
  metricLabel: { color: "#5d7166", fontSize: 12, fontWeight: "600" }, metricValue: { color: "#173e32", fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  caption: { color: "#62766a", fontSize: 11, lineHeight: 17 }, body: { color: "#5b7064", fontSize: 14, lineHeight: 21 },
  panel: { backgroundColor: "#ffffff", padding: 20, borderWidth: 1, borderColor: "#dee7e1", borderRadius: 20, gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }, divider: { height: 1, backgroundColor: "#e8eee9" },
  homeMark: { width: 52, height: 52, borderRadius: 15, backgroundColor: "#e9f1eb", alignItems: "center", justifyContent: "center" }, homeEmoji: { fontSize: 28, lineHeight: 36 },
  cardTitle: { fontSize: 16, lineHeight: 23, fontWeight: "700", color: "#203f32" }, status: { fontSize: 14, color: "#23704e", fontWeight: "600", marginTop: 4 }, detail: { fontSize: 14, color: "#203f32", marginTop: 4 },
  action: { borderRadius: 12, borderWidth: 1, borderColor: "#dde7df", backgroundColor: "#f2f6f2", minHeight: 50, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  actionDark: { backgroundColor: "#14634e", borderColor: "#14634e" }, actionText: { flex: 1, color: "#234b38", fontSize: 14, fontWeight: "600", lineHeight: 20 }, arrow: { color: "#436f56", fontSize: 18 }, white: { color: "#ffffff" },
  activity: { gap: 6, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e8eee9" },
  featureCard: { borderWidth: 1, borderColor: "#dee7e1", backgroundColor: "#ffffff", borderRadius: 18, padding: 18, gap: 12, minHeight: 180, justifyContent: "space-between" },
  iconBadge: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" }, featureEmoji: { fontSize: 25, lineHeight: 34 }, featureArrow: { marginLeft: "auto", color: "#708779", fontSize: 19 },
  notice: { backgroundColor: "#fff4df", borderRadius: 12, padding: 14, color: "#75551c", fontSize: 13, lineHeight: 20 },
  footer: { gap: 12, paddingTop: 4 }, pressed: { opacity: 0.55 },
});
