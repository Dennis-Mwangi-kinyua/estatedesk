import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { AppIcon, IconTile } from "./app-icon";
import { StatusBadge } from "./screen-layout";
import { dashboardStyles as d } from "./dashboard-ui";
import { useCardGrid, cardGridStyles } from "./card-grid";

/** Native collection pages share navigation and accessibility, while keeping their own records and actions. */
export function NativeRecordList({ records, emoji, open, title, cards = false }: {
  records: NativeWorkspaceRecord[]; emoji: string; title: string; open: (id: string) => void; cards?: boolean;
}) {
  const grid = useCardGrid();
  const [status, setStatus] = useState<string | null>(null);
  const statuses = useMemo(() => [...new Set(records.flatMap(record => record.status ? [record.status] : []))], [records]);
  const selected = status && statuses.includes(status) ? status : null;
  const visible = selected ? records.filter(record => record.status === selected) : records;
  return <View style={{ gap: 16 }} onLayout={grid.onLayout}>
    {statuses.length > 1 ? <View style={{ gap: 8 }}>
      <Text style={d.caption}>Filter statuses on this page</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[null, ...statuses].map(value => <Pressable key={value ?? "all"} accessibilityRole="button" accessibilityLabel={value ? `Filter ${value.replaceAll("_", " ")}` : "Show all statuses"} accessibilityState={{ selected: selected === value }} onPress={() => setStatus(value)} style={[s.chip, selected === value && s.selected]}>
          <Text style={[s.chipText, selected === value && s.selectedText]}>{value?.replaceAll("_", " ") ?? "All"}</Text>
        </Pressable>)}
      </ScrollView>
    </View> : null}
    <View style={cards ? cardGridStyles.grid : s.list}>{visible.map((record, index) => <Pressable key={record.id} accessibilityRole="button" accessibilityLabel={record.title} accessibilityHint={`Open full details in ${title}`} onPress={() => open(record.id)} style={({ pressed }) => [s.record, cards ? [s.card, grid.cell] : index > 0 && s.border, pressed && s.pressed]}>
      <View style={s.heading}><IconTile badge={emoji} size={20} /><View style={s.identity}>
        <Text style={d.cardTitle}>{record.title}</Text>
        {record.subtitle ? <Text numberOfLines={2} style={d.body}>{record.subtitle}</Text> : null}
      </View><AppIcon name="chevron-right" size={20} /></View>
      {record.status ? <StatusBadge status={record.status} /> : null}
      <View style={s.preview}>{record.fields.slice(0, cards ? 6 : 2).map((field, fieldIndex) => <View key={`${fieldIndex}:${field.label}`} style={[s.previewField, cards && s.cardField]}>
        <Text style={d.caption}>{field.label}</Text><Text numberOfLines={2} style={d.body}>{field.value}</Text>
      </View>)}</View>
      <Text style={s.open}>View details</Text>
    </Pressable>)}</View>
  </View>;
}

const s = StyleSheet.create({
  list: { borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#dce6e0", overflow: "hidden" },
  record: { padding: 20, gap: 14, minHeight: 100 },
  card: { borderRadius: 18, borderWidth: 1, borderColor: "#dce6e0", backgroundColor: "#fff", minWidth: 0, padding: 16 },
  border: { borderTopWidth: 1, borderTopColor: "#e5ece7" },
  pressed: { backgroundColor: "#edf5f0" },
  heading: { flexDirection: "row", gap: 12, alignItems: "center" },
  identity: { flex: 1, minWidth: 0, gap: 4 },
  preview: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  previewField: { flexGrow: 1, flexBasis: 120, minWidth: 0, gap: 4 },
  cardField: { flexBasis: 80, flexShrink: 1 },
  open: { color: "#14634e", fontSize: 12, fontWeight: "600", marginTop: "auto" },
  chip: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 44, borderRadius: 24, borderWidth: 1, borderColor: "#dce6e0", backgroundColor: "#fff", justifyContent: "center" },
  selected: { backgroundColor: "#173e32", borderColor: "#173e32" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#436354" },
  selectedText: { color: "#fff" },
});
