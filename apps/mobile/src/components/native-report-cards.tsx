import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { AppIcon, IconTile, type AppIconName } from "./app-icon";
import { useCardGrid, cardGridStyles } from "./card-grid";
import { DashboardSection } from "./dashboard-ui";

const sections: { title: string; description: string; ids: string[]; icon: AppIconName; color: string }[] = [
  { title: "Needs attention", description: "Current backlog across all dates", ids: ["attention"], icon: "alert-circle", color: "#a63c44" },
  { title: "Workspace coverage", description: "Organization status across the platform", ids: ["organizations"], icon: "briefcase", color: "#3265bb" },
  { title: "Billing & payments", description: "Subscription health and recent payment activity", ids: ["subscriptions", "payment-volume"], icon: "credit-card", color: "#16805d" },
  { title: "Operations & delivery", description: "Maintenance workload and notification backlog", ids: ["issues", "notifications"], icon: "activity", color: "#b66a12" },
];

/** Shared report hierarchy and measured card widths for iOS and Android. */
export function NativeReportCards({ records, open, busy }: { records: NativeWorkspaceRecord[]; open: (id: string) => void; busy: boolean }) {
  const grid = useCardGrid();
  return <View style={s.sections} onLayout={grid.onLayout}>
    {sections.map(section => {
      const items = section.ids.flatMap(id => records.filter(record => record.id === id));
      if (!items.length) return null;
      return <DashboardSection key={section.title} title={section.title} description={section.description}>
        <View style={cardGridStyles.grid}>{items.map(record => {
          const [primary, ...fields] = record.fields;
          return <Pressable key={record.id} accessibilityRole="button" accessibilityLabel={record.title} accessibilityHint="Open all report details" disabled={busy} onPress={() => open(record.id)} style={({ pressed }) => [cardGridStyles.card, s.card, items.length === 1 ? s.wide : grid.columns > 2 ? s.tabletCell : grid.cell, { borderTopColor: section.color }, pressed && cardGridStyles.pressed, busy && cardGridStyles.disabled]}>
            <View style={s.heading}><IconTile name={record.id === "notifications" ? "bell" : record.id === "issues" ? "tool" : section.icon} size={21} /><AppIcon name="chevron-right" size={18} /></View>
            <Text style={s.title}>{record.title}</Text>
            {primary ? <View style={s.metric}><Text style={[s.value, { color: section.color }]}>{primary.value}</Text><Text style={s.label}>{primary.label}</Text></View> : null}
            {record.subtitle ? <Text style={s.description}>{record.subtitle}</Text> : null}
            <View style={s.fields}>{fields.filter(field => field.label !== "Updated" && field.label !== "Snapshot time").map((field, index) => <View key={`${index}:${field.label}`} style={s.field}><Text style={s.label}>{field.label}</Text><Text style={s.fieldValue}>{field.value}</Text></View>)}</View>
            <View style={cardGridStyles.footer}><Text style={cardGridStyles.footerText}>Full report</Text><AppIcon name="arrow-up-right" size={16} /></View>
          </Pressable>;
        })}</View>
      </DashboardSection>;
    })}
  </View>;
}
const s = StyleSheet.create({
  sections: { gap: 24 },
  card: { borderTopWidth: 3, minWidth: 0 },
  wide: { width: "100%" },
  tabletCell: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { color: "#173e32", fontSize: 16, lineHeight: 23, fontWeight: "700" },
  metric: { gap: 3 },
  value: { fontSize: 30, lineHeight: 38, fontWeight: "800", fontVariant: ["tabular-nums"] },
  label: { color: "#62766a", fontSize: 12, lineHeight: 18 },
  description: { color: "#52685c", fontSize: 12, lineHeight: 19 },
  fields: { gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e8eee9" },
  field: { gap: 3 },
  fieldValue: { color: "#173e32", fontSize: 14, lineHeight: 21, fontWeight: "600", fontVariant: ["tabular-nums"], flexShrink: 1 },
});
