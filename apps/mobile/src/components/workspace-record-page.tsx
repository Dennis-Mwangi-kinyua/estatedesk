import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { AppIcon, IconTile } from "./app-icon";
import { Button, styles } from "./ui";
import { StatusBadge } from "./screen-layout";
import { DashboardSection, dashboardStyles as d } from "./dashboard-ui";

/** A separate native detail surface with iOS and Android back support. */
export function WorkspaceRecordPage({ record, workspace, emoji, close, act, open, children }: {
  record: NativeWorkspaceRecord; workspace: string; emoji: string; close: () => void;
  open: (link: NonNullable<NativeWorkspaceRecord["links"]>[number]) => void;
  act: (actionId: string, recordId: string) => void; children?: ReactNode;
}) {
  const recent = recentField(record.fields);
  return <Modal animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <SafeAreaView style={s.surface} edges={["top", "bottom"]}>
      <View style={s.toolbar}><Button label={`Back to ${workspace}`} icon="arrow-left" secondary onPress={close} /></View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={d.hero}>
          <Text style={d.eyebrow}>{workspace.toUpperCase()} · RECORD DETAILS</Text>
          <IconTile badge={emoji} size={30} />
          <Text accessibilityRole="header" style={d.heroTitle}>{record.title}</Text>
          {record.status ? <View style={s.status}><StatusBadge status={record.status} /></View> : null}
          {record.subtitle ? <Text selectable style={d.heroBody}>{record.subtitle}</Text> : null}
        </View>
        <DashboardSection title="Record overview" description="Key details for this record.">
          {record.fields.length ? <View style={s.fields}>{record.fields.map((field, index) => <View key={`${index}-${field.label}`} style={s.fieldCard}>
            <View style={s.fieldHeading}><FieldIcon label={field.label} index={index} /><Text style={s.label}>{field.label}</Text></View>
            <Text selectable style={s.value}>{field.value || "—"}</Text>
          </View>)}</View> : <View style={styles.card}><Text style={styles.subtitle}>No additional details are available for this record.</Text></View>}
        </DashboardSection>
        {recent ? <View style={s.recentCard}>
          <View style={s.recentIcon}><AppIcon name="clock" size={19} color="#6d45bf" /></View>
          <View style={s.actionCopy}><Text style={s.recentEyebrow}>RECENT ACTIVITY</Text><Text style={s.actionTitle}>{recent.label}</Text><Text selectable style={s.actionDescription}>{recent.value}</Text></View>
        </View> : null}
        {record.links?.length ? <DashboardSection title="Related pages" description="Open related records in the app.">
          <View style={s.cards}>{record.links.map(link => <Pressable key={`${link.path}:${link.recordId ?? ""}`} accessibilityRole="button" accessibilityLabel={link.title} accessibilityHint="Opens this page inside the app" onPress={() => open(link)} style={({ pressed }) => [s.actionCard, pressed && s.pressed]}>
            <IconTile badge={link.emoji} size={20} /><View style={s.actionCopy}><Text style={s.actionTitle}>{link.title}</Text><Text numberOfLines={2} style={s.actionDescription}>{link.description}</Text><Text style={s.nativeLabel}>Open in app</Text></View><AppIcon name="chevron-right" size={20} />
          </Pressable>)}</View>
        </DashboardSection> : null}
        {record.actions?.length ? <DashboardSection title="Manage this record" description="Choose an action. Forms open as native screens in the app.">
          <View style={s.cards}>{record.actions.map(action => <Pressable key={action.id} accessibilityRole="button" accessibilityLabel={action.title} accessibilityHint="Opens a native action form" onPress={() => act(action.id, record.id)} style={({ pressed }) => [s.actionCard, action.destructive && s.destructiveCard, pressed && s.pressed]}>
            <IconTile name={actionIcon(action.id, action.destructive)} size={20} /><View style={s.actionCopy}><Text style={s.actionTitle}>{action.title}</Text><Text style={s.actionDescription}>{action.destructive ? "Review this protected action before applying it." : "Open the native form to review and update this record."}</Text><Text style={[s.nativeLabel, action.destructive && { color: "#a63c44" }]}>Manage in app</Text></View><AppIcon name="chevron-right" size={20} color={action.destructive ? "#a63c44" : undefined} />
          </Pressable>)}</View>
        </DashboardSection> : null}
      </ScrollView>
      {children}
    </SafeAreaView>
  </Modal>;
}

const s = StyleSheet.create({
  surface: { flex: 1, backgroundColor: "#f3f6f4" },
  toolbar: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#dce6df" },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 20, gap: 26, paddingBottom: 40 },
  status: { alignSelf: "flex-start", backgroundColor: "#ffffff", borderRadius: 8 },
  fields: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  fieldCard: { flexGrow: 1, flexBasis: "46%", minWidth: 145, minHeight: 106, gap: 11, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "#dce6df", backgroundColor: "#ffffff" },
  fieldHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  fieldIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  label: { color: "#62766a", fontSize: 12, fontWeight: "600" },
  value: { color: "#173e32", fontSize: 15, lineHeight: 22, fontWeight: "600" },
  cards: { gap: 10 },
  actionCard: { minHeight: 104, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#dce6df", backgroundColor: "#ffffff" },
  destructiveCard: { borderColor: "#f0d4d4", backgroundColor: "#fffafa" },
  actionCopy: { flex: 1, minWidth: 0, gap: 4 },
  actionTitle: { color: "#173e32", fontSize: 15, lineHeight: 20, fontWeight: "700" },
  actionDescription: { color: "#62766a", fontSize: 12, lineHeight: 17 },
  nativeLabel: { marginTop: 2, color: "#14634e", fontSize: 11, fontWeight: "700" },
  pressed: { backgroundColor: "#edf5f0", opacity: 0.8 },
  recentCard: { flexDirection: "row", alignItems: "center", gap: 13, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "#e4dcf4", backgroundColor: "#faf8ff" },
  recentIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#eee8fb" },
  recentEyebrow: { color: "#7655b5", fontSize: 10, lineHeight: 15, fontWeight: "800", letterSpacing: 1 },
});

const fieldColors = [
  { background: "#e7f4ed", border: "#c9e4d4", color: "#16805d" },
  { background: "#eaf1fd", border: "#d3e0fa", color: "#3265bb" },
  { background: "#fff3e4", border: "#f2dfc1", color: "#b66a12" },
  { background: "#f3eafd", border: "#e2d4f5", color: "#7952b9" },
  { background: "#e4f4f5", border: "#cbe8e9", color: "#087e8b" },
  { background: "#fdebf0", border: "#f4d5df", color: "#b84268" },
];

function FieldIcon({ label, index }: { label: string; index: number }) {
  const palette = fieldColors[index % fieldColors.length];
  return <View style={[s.fieldIcon, { backgroundColor: palette.background, borderColor: palette.border }]}><AppIcon name={fieldIcon(label)} size={17} color={palette.color} /></View>;
}

function fieldIcon(label: string): "user" | "home" | "clock" | "credit-card" | "file-text" | "map-pin" | "info" {
  const value = label.toLowerCase();
  if (/tenant|member|owner|user|contact|caretaker/.test(value)) return "user";
  if (/property|unit|house|building|room/.test(value)) return "home";
  if (/date|time|created|updated|due|reported|submitted|scheduled/.test(value)) return "clock";
  if (/amount|rent|paid|balance|deposit|price|cost|total|fee/.test(value)) return "credit-card";
  if (/agreement|document|description|note|message|summary/.test(value)) return "file-text";
  if (/location|address|place/.test(value)) return "map-pin";
  return "info";
}

function recentField(fields: NativeWorkspaceRecord["fields"]) {
  const priorities = [/updated/i, /completed/i, /submitted/i, /reported/i, /received/i, /created/i, /scheduled/i, /activity|date/i];
  return priorities.map(pattern => fields.find(field => pattern.test(field.label) && field.value && field.value !== "—")).find(Boolean);
}

function actionIcon(id: string, destructive?: boolean): "shield" | "edit-3" | "plus" | "check-circle" | "download" | "user-check" | "settings" {
  if (destructive) return "shield";
  if (/create|add|invite|new/.test(id)) return "plus";
  if (/approve|verify|review|complete/.test(id)) return "check-circle";
  if (/download|export/.test(id)) return "download";
  if (/user|identity|member/.test(id)) return "user-check";
  if (/setting|toggle|config/.test(id)) return "settings";
  return "edit-3";
}
