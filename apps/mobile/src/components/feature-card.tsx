import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { AppIcon, IconTile, type AppIconName } from "./app-icon";
import { cardGridStyles } from "./card-grid";

/** One native card layout for tenant, management and field tools on both platforms. */
export function FeatureCard({ title, description, badge, icon, onPress, disabled, style, compact = false }: {
  title: string; description: string; badge?: string; icon?: AppIconName;
  onPress: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; compact?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description}
    accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [cardGridStyles.card, s.card, compact && s.compact, style, pressed && cardGridStyles.pressed, disabled && cardGridStyles.disabled]}>
    <View style={s.top}><IconTile badge={badge} name={icon} size={22} /><AppIcon name="chevron-right" size={17} color="#8b9c93" /></View>
    <Text style={s.title}>{title}</Text>
    <Text style={s.description}>{description}</Text>
  </Pressable>;
}
const s = StyleSheet.create({
  card: { minWidth: 0, minHeight: 176, gap: 10, padding: 16, alignItems: "stretch" },
  compact: { minHeight: 154 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  title: { minHeight: 42, color: "#173e32", fontSize: 15, lineHeight: 21, fontWeight: "700", letterSpacing: -0.2 },
  description: { color: "#62766a", fontSize: 12, lineHeight: 18, flexGrow: 1 },
});
