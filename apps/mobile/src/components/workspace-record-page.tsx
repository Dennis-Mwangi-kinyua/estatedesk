import type { ReactNode } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { IconTile } from "./app-icon";
import { Button, styles } from "./ui";
import { StatusBadge } from "./screen-layout";
import { DashboardSection, dashboardStyles as d } from "./dashboard-ui";

/** A separate native detail surface with iOS and Android back support. */
export function WorkspaceRecordPage({ record, workspace, emoji, close, act, children }: {
  record: NativeWorkspaceRecord; workspace: string; emoji: string; close: () => void;
  act: (actionId: string, recordId: string) => void; children?: ReactNode;
}) {
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
        <DashboardSection title="Record overview" description="Full details available to your account.">
          <View style={styles.card}>{record.fields.length ? record.fields.map((field, index) => <View key={`${index}-${field.label}`} style={[s.field, index > 0 && s.separator]}>
            <Text style={s.label}>{field.label}</Text>
            <Text selectable style={s.value}>{field.value || "—"}</Text>
          </View>) : <Text style={styles.subtitle}>No additional details are available for this record.</Text>}</View>
        </DashboardSection>
        {record.actions?.length ? <DashboardSection title="Manage this record" description="Choose an action to review its details before continuing.">
          {record.actions.map(action => <Button key={action.id} label={action.title} icon={action.destructive ? "shield" : "edit-3"} secondary={action.destructive} onPress={() => act(action.id, record.id)} />)}
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
  field: { gap: 8, paddingVertical: 12 },
  separator: { borderTopWidth: 1, borderTopColor: "#e8eee9" },
  label: { color: "#62766a", fontSize: 12, fontWeight: "600" },
  value: { color: "#173e32", fontSize: 16, lineHeight: 25 },
});
