import { AppIcon } from "./app-icon";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type TenantTab = "home" | "services" | "activity" | "account";
export function TenantNavigation({ selected, select, account, disabled }: {
  selected: TenantTab; select: (tab: TenantTab) => void; account: () => void; disabled: boolean;
}) {
  return <View style={styles.bar}><View style={styles.inner}>
    {([
      { id: "home", label: "Home", emoji: "🏡" },
      { id: "services", label: "Services", emoji: "🗂️" },
      { id: "activity", label: "Activity", emoji: "🕘" },
      { id: "account", label: "Account", emoji: "👤" },
    ] as const).map(item => <Pressable key={item.id} accessibilityRole={item.id === "account" ? "button" : "tab"}
      accessibilityLabel={item.label} accessibilityState={{ selected: selected === item.id, disabled }} disabled={disabled}
      onPress={() => item.id === "account" ? account() : select(item.id)}
      style={({ pressed }) => [styles.item, selected === item.id && styles.selected, (pressed || disabled) && { opacity: 0.55 }]}>
      <AppIcon badge={item.emoji} size={22} /><Text style={[styles.label, selected === item.id && styles.selectedLabel]}>{item.label}</Text>
    </Pressable>)}
  </View></View>;
}
const styles = StyleSheet.create({
  inner: { flexDirection: "row", width: "100%", maxWidth: 680, alignSelf: "center", gap: 4 },
  bar: { backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#dfe8e1", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, gap: 4 },
  item: { flex: 1, minWidth: 0, minHeight: 58, paddingVertical: 8, paddingHorizontal: 2, alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 14 },
  selected: { backgroundColor: "#eaf3ec" }, icon: { fontSize: 21, lineHeight: 28 },
  label: { textAlign: "center", flexShrink: 1, color: "#607369", fontSize: 11, fontWeight: "500" }, selectedLabel: { color: "#14634e", fontWeight: "700" },
});
